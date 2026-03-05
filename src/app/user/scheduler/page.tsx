'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COURTS } from '@/lib/constants';
import { getTimeslots } from '@/lib/services/vortexloop-api';
import { format, addDays, startOfDay, addHours, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface Timeslot {
  id: string | number;
  relayGroupId: string;
  timeFrom: string;
  timeTo: string;
  state: number;
  ownerFriendlyName: string;
  title: string;
  [key: string]: unknown;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 to 21:00

export default function SchedulerPage() {
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');

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

  function getTimeslotsForCourtAndDay(courtId: string, date: Date): Timeslot[] {
    return timeslots.filter(
      (ts) => ts.relayGroupId === courtId && isSameDay(new Date(ts.timeFrom), date)
    );
  }

  function getSlotStyle(ts: Timeslot): React.CSSProperties {
    const from = new Date(ts.timeFrom);
    const to = new Date(ts.timeTo);
    const startHour = from.getHours() + from.getMinutes() / 60;
    const endHour = to.getHours() + to.getMinutes() / 60;
    const top = ((startHour - 6) / 16) * 100;
    const height = ((endHour - startHour) / 16) * 100;
    return {
      position: 'absolute',
      top: `${top}%`,
      height: `${Math.max(height, 2)}%`,
      left: '2px',
      right: '2px',
    };
  }

  return (
    <div className="flex h-full flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center font-medium">
            {format(selectedDate, 'EEEE, dd MMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(v) => setView(v as 'day' | 'week')}>
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-1 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-h-full">
          {/* Column headers */}
          <div className="sticky top-0 z-10 grid grid-cols-[60px_1fr_1fr_1fr_1fr] border-b bg-background">
            <div className="border-r p-2 text-xs text-muted-foreground">Time</div>
            {COURTS.map((court) => (
              <div key={court.id} className="border-r p-2 text-center text-sm font-medium">
                {court.name}
              </div>
            ))}
          </div>

          {/* Time rows */}
          <div className="relative grid grid-cols-[60px_1fr_1fr_1fr_1fr]">
            {/* Time labels */}
            <div className="border-r">
              {HOURS.map((hour) => (
                <div key={hour} className="flex h-16 items-start border-b px-2 text-xs text-muted-foreground">
                  {format(addHours(startOfDay(selectedDate), hour), 'HH:mm')}
                </div>
              ))}
            </div>

            {/* Court columns with slots */}
            {COURTS.map((court) => {
              const daySlots = getTimeslotsForCourtAndDay(court.id, selectedDate);
              return (
                <div key={court.id} className="relative border-r">
                  {/* Hour grid lines */}
                  {HOURS.map((hour) => (
                    <div key={hour} className="h-16 border-b" />
                  ))}

                  {/* Timeslot blocks */}
                  {daySlots.map((ts) => (
                    <div
                      key={String(ts.id)}
                      className="cursor-pointer rounded-sm bg-primary/20 border border-primary/30 px-1.5 py-0.5 text-xs hover:bg-primary/30"
                      style={getSlotStyle(ts)}
                    >
                      <div className="truncate font-medium">{ts.title || ts.ownerFriendlyName}</div>
                      <div className="truncate text-muted-foreground">
                        {format(new Date(ts.timeFrom), 'HH:mm')} — {format(new Date(ts.timeTo), 'HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
