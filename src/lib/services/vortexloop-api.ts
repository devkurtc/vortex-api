import { executeSimpleRequest } from '@/lib/engine/request-executor';
import { useEnvironmentStore } from '@/lib/stores/environment-store';

function getBaseUrl(): string {
  const env = useEnvironmentStore.getState().getActiveEnvironment();
  if (env) {
    const sitedomain = env.variables.find((v) => v.key === 'sitedomain' && v.enabled);
    if (sitedomain?.value) return sitedomain.value;
  }
  return 'https://vltc.vortexloop.com/';
}

// ─── Timeslots ────────────────────────────────────────────────

export async function getTimeslots() {
  const base = getBaseUrl();
  return executeSimpleRequest('GET', `${base}api/timeslots`);
}

export async function getTimeslot(id: string) {
  const base = getBaseUrl();
  return executeSimpleRequest('GET', `${base}api/timeslots/${id}`);
}

export async function createTimeslot(data: {
  relayGroupId: string;
  timeFrom: string;
  timeTo: string;
  state: number;
  ownerFriendlyName: string;
  title: string;
  description: string;
  type: string;
}) {
  const base = getBaseUrl();
  return executeSimpleRequest('POST', `${base}api/timeslots`, data);
}

export async function updateTimeslot(id: string, data: object) {
  const base = getBaseUrl();
  return executeSimpleRequest('PUT', `${base}api/timeslots/${id}`, data);
}

export async function deleteTimeslot(id: string) {
  const base = getBaseUrl();
  return executeSimpleRequest('DELETE', `${base}api/timeslots/${id}`);
}

// ─── Relays ───────────────────────────────────────────────────

export async function getRelays() {
  const base = getBaseUrl();
  return executeSimpleRequest('GET', `${base}api/relays`);
}

export async function updateRelay(id: number, state: number) {
  const base = getBaseUrl();
  return executeSimpleRequest('PUT', `${base}api/relays/${id}`, { id, state });
}

// ─── Settings ─────────────────────────────────────────────────

export async function getSettings() {
  const base = getBaseUrl();
  return executeSimpleRequest('GET', `${base}api/settings`);
}

export async function patchSettings(data: object) {
  const base = getBaseUrl();
  return executeSimpleRequest('PATCH', `${base}api/settings`, data);
}
