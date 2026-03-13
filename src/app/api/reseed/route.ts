import { NextRequest } from 'next/server';

const TIMESLOT_FEED_URL = 'https://www.vltc.com.mt/timeslots/TimeSlot';
const TIMESLOT_FEED_KEY = '3ca673e02690478fb0c4d41bed07d3fb';

/**
 * SSE endpoint that cleans all setRelayGroup jobs from Agenda,
 * fetches fresh timeslots from the VLTC feed, and re-seeds them.
 *
 * Streams progress events to the client in real-time.
 */
export async function POST(request: NextRequest) {
  const { baseUrl, token } = await request.json();

  if (!baseUrl) {
    return new Response(JSON.stringify({ error: 'baseUrl is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const dashBase = `${baseUrl.replace(/\/$/, '')}/dash/api`;
  const apiBase = `${baseUrl.replace(/\/$/, '')}/api`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(type: 'info' | 'success' | 'error' | 'warn', message: string) {
        const data = JSON.stringify({ type, message, timestamp: new Date().toISOString() });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }

      try {
        // ── Step 1: Fetch all jobs from Agendash ──
        send('info', 'Connecting to Agendash API...');
        const jobsRes = await fetch(`${dashBase}?limit=1000&skip=0`);
        if (!jobsRes.ok) {
          send('error', `Failed to fetch jobs from Agendash: HTTP ${jobsRes.status}`);
          controller.close();
          return;
        }

        const jobsData = await jobsRes.json();
        const allJobs = jobsData.jobs || [];
        send('info', `Found ${allJobs.length} total jobs in Agenda`);

        // ── Step 2: Filter out cleanDB — only delete setRelayGroup jobs ──
        const relayJobs = allJobs.filter((j: { job: { name: string } }) => j.job.name === 'setRelayGroup');
        const cleanDbJobs = allJobs.filter((j: { job: { name: string } }) => j.job.name === 'cleanDB');
        send('info', `Found ${relayJobs.length} setRelayGroup jobs to delete (preserving ${cleanDbJobs.length} cleanDB job${cleanDbJobs.length !== 1 ? 's' : ''})`);

        // ── Step 3: Delete setRelayGroup jobs in batches ──
        if (relayJobs.length > 0) {
          send('info', 'Deleting setRelayGroup jobs...');
          const jobIds = relayJobs.map((j: { job: { _id: string } }) => j.job._id);

          // Agendash2 delete endpoint accepts an array of IDs
          const deleteRes = await fetch(`${dashBase}/jobs/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobIds }),
          });

          if (!deleteRes.ok) {
            send('error', `Failed to delete jobs: HTTP ${deleteRes.status}`);
            controller.close();
            return;
          }

          send('success', `Deleted ${jobIds.length} setRelayGroup jobs`);
        } else {
          send('info', 'No setRelayGroup jobs to delete — Agenda is clean');
        }

        // ── Step 4: Fetch fresh timeslots from external feed ──
        send('info', `Fetching timeslots from ${TIMESLOT_FEED_URL}...`);
        const feedRes = await fetch(TIMESLOT_FEED_URL, {
          headers: { 'X-API-KEY': TIMESLOT_FEED_KEY },
        });

        if (!feedRes.ok) {
          send('error', `Failed to fetch timeslot feed: HTTP ${feedRes.status}`);
          controller.close();
          return;
        }

        let timeslots: Array<Record<string, unknown>>;
        try {
          timeslots = await feedRes.json();
        } catch {
          send('error', 'Failed to parse timeslot feed response as JSON');
          controller.close();
          return;
        }

        if (!Array.isArray(timeslots)) {
          send('error', `Unexpected feed response — expected array, got ${typeof timeslots}`);
          controller.close();
          return;
        }

        send('success', `Received ${timeslots.length} timeslots from feed`);

        // ── Step 5: Seed each timeslot via the VLTC API ──
        if (timeslots.length === 0) {
          send('warn', 'No timeslots to seed — feed returned empty array');
        } else {
          send('info', 'Seeding timeslots into Agenda...');

          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          let seeded = 0;
          let failed = 0;

          for (const slot of timeslots) {
            try {
              const slotId = slot.id || slot._id || 'unknown';
              const seedRes = await fetch(`${apiBase}/timeslots/${slotId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(slot),
              });

              if (seedRes.ok) {
                seeded++;
                const label = slot.title || slot.ownerFriendlyName || slotId;
                send('info', `[${seeded}/${timeslots.length}] Seeded: ${label} (group ${slot.relayGroupId})`);
              } else {
                failed++;
                const errBody = await seedRes.text();
                send('warn', `[${seeded + failed}/${timeslots.length}] Failed to seed slot ${slot.id}: HTTP ${seedRes.status} — ${errBody}`);
              }
            } catch (err) {
              failed++;
              send('error', `Failed to seed slot: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }

          send('success', `Seeding complete: ${seeded} succeeded, ${failed} failed out of ${timeslots.length}`);
        }

        // ── Done ──
        send('success', 'Reseed operation complete');
        controller.close();
      } catch (err) {
        send('error', `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
