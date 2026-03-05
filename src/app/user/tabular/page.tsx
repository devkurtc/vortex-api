'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { COURTS } from '@/lib/constants';
import { getTimeslots, deleteTimeslot } from '@/lib/services/vortexloop-api';
import { format } from 'date-fns';
import { RefreshCw, Search, Trash2 } from 'lucide-react';

interface Timeslot {
  id: string | number;
  relayGroupId: string;
  timeFrom: string;
  timeTo: string;
  state: number;
  ownerId: string;
  ownerFriendlyName: string;
  title: string;
  type: string;
  originalTimeFrom: string;
  originalTimeTo: string;
  originalState: number;
  sunlightAwareAffected: boolean;
  createdOn: string;
  description: string;
  [key: string]: unknown;
}

/** Group key from the original booking slot time range */
function slotGroupKey(ts: Timeslot): string {
  const from = ts.originalTimeFrom || ts.timeFrom;
  const to = ts.originalTimeTo || ts.timeTo;
  return `${format(new Date(from), 'yyyy-MM-dd')}|${format(new Date(from), 'HH:mm')}-${format(new Date(to), 'HH:mm')}`;
}

/** Format the gray group header label */
function slotGroupLabel(ts: Timeslot): string {
  const from = new Date(ts.originalTimeFrom || ts.timeFrom);
  const to = new Date(ts.originalTimeTo || ts.timeTo);
  return `${format(from, 'EEE, dd MMM yy')}  |  ${format(from, 'HH:mm')} - ${format(to, 'HH:mm')}`;
}

/** Check if the light time differs from the original booking time */
function isLightTimeUpdated(ts: Timeslot): boolean {
  if (ts.sunlightAwareAffected) return true;
  const origFrom = ts.originalTimeFrom || ts.timeFrom;
  const origTo = ts.originalTimeTo || ts.timeTo;
  // Compare ignoring milliseconds
  const fromDiff = Math.abs(new Date(ts.timeFrom).getTime() - new Date(origFrom).getTime()) > 60000;
  const toDiff = Math.abs(new Date(ts.timeTo).getTime() - new Date(origTo).getTime()) > 60000;
  return fromDiff || toDiff;
}

/** Format light time range (HH:mm:ss) */
function formatLightTime(ts: Timeslot): string {
  return `${format(new Date(ts.timeFrom), 'HH:mm:ss')} - ${format(new Date(ts.timeTo), 'HH:mm:ss')}`;
}

/** Determine light state based on current time and state */
function getLightState(ts: Timeslot): 'Lights On' | 'Lights Off' {
  const now = new Date();
  const from = new Date(ts.timeFrom);
  const to = new Date(ts.timeTo);
  if (ts.state === 1 && now >= from && now <= to) return 'Lights On';
  return 'Lights Off';
}

export default function TabularPage() {
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [courtFilter, setCourtFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTimeslots();
      if (res.status === 200) {
        try { setTimeslots(JSON.parse(res.body)); } catch { /* ignore */ }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = timeslots.filter((ts) => {
    if (courtFilter !== 'all' && ts.relayGroupId !== courtFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        ts.ownerFriendlyName?.toLowerCase().includes(q) ||
        ts.title?.toLowerCase().includes(q) ||
        String(ts.id).includes(q)
      );
    }
    return true;
  });

  // Sort by original time, then group
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.originalTimeFrom || a.timeFrom).getTime() - new Date(b.originalTimeFrom || b.timeFrom).getTime()
  );

  // Build grouped structure
  const groups: { key: string; label: string; slots: Timeslot[] }[] = [];
  let lastKey = '';
  for (const ts of sorted) {
    const key = slotGroupKey(ts);
    if (key !== lastKey) {
      groups.push({ key, label: slotGroupLabel(ts), slots: [] });
      lastKey = key;
    }
    groups[groups.length - 1].slots.push(ts);
  }

  async function handleDelete(id: string | number) {
    const res = await deleteTimeslot(String(id));
    if (res.status === 200) {
      setTimeslots((prev) => prev.filter((ts) => ts.id !== id));
    }
  }

  function getCourtLabel(groupId: string): string {
    const court = COURTS.find((c) => c.id === groupId);
    return court ? court.id : groupId;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-60"
            />
          </div>
          <Tabs value={courtFilter} onValueChange={setCourtFilter}>
            <TabsList>
              <TabsTrigger value="all">All Courts</TabsTrigger>
              {COURTS.map((court) => (
                <TabsTrigger key={court.id} value={court.id}>
                  {court.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`mr-1 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">Court</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Slot State</TableHead>
              <TableHead>Light Time Updated?</TableHead>
              <TableHead>Light Time</TableHead>
              <TableHead>Light State</TableHead>
              <TableHead>Slot Type</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Loading timeslots...
                </TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No timeslots found
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <>
                  {/* Group header — booking slot time range */}
                  <TableRow key={group.key} className="bg-muted/60 hover:bg-muted/60">
                    <TableCell colSpan={8} className="text-center text-sm font-medium py-1.5">
                      {group.label}
                    </TableCell>
                  </TableRow>

                  {/* Rows within the group */}
                  {group.slots.map((ts) => {
                    const lightUpdated = isLightTimeUpdated(ts);
                    const lightState = getLightState(ts);
                    return (
                      <TableRow key={String(ts.id)}>
                        <TableCell className="text-center font-mono">{getCourtLabel(ts.relayGroupId)}</TableCell>
                        <TableCell>{ts.ownerFriendlyName?.trim()}</TableCell>
                        <TableCell>
                          <Badge variant={ts.state === 1 ? 'default' : 'secondary'}>
                            {ts.state === 1 ? 'Set On' : 'Set Off'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {lightUpdated ? 'True' : 'False'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatLightTime(ts)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={lightState === 'Lights On' ? 'default' : 'outline'}>
                            {lightState}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal capitalize">
                            {ts.type === 'external' ? 'Bookings' : ts.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(ts.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </>
              ))
            )}
          </TableBody>
        </Table>
        <div className="mt-2 text-xs text-muted-foreground">
          Showing {filtered.length} timeslots in {groups.length} time groups
        </div>
      </div>
    </div>
  );
}
