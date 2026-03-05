'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { COURTS } from '@/lib/constants';
import { getRelays, getTimeslots, getSettings, patchSettings, updateRelay } from '@/lib/services/vortexloop-api';
import { Lightbulb, RefreshCw, Sunrise, Sunset } from 'lucide-react';
import { format } from 'date-fns';

interface RelayState {
  id: number;
  state: number;
  relayGroupId?: number;
  [key: string]: unknown;
}

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

interface RelayGroupSettings {
  mode: string;
  sunlightOffset: number;
}

export default function DashboardPage() {
  const [relays, setRelays] = useState<RelayState[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [relayGroups, setRelayGroups] = useState<Record<string, RelayGroupSettings>>({});
  const [loading, setLoading] = useState(true);
  const [togglingRelay, setTogglingRelay] = useState<number | null>(null);
  const [togglingMode, setTogglingMode] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [relayRes, timeslotRes, settingsRes] = await Promise.all([
        getRelays(), getTimeslots(), getSettings(),
      ]);

      if (relayRes.status === 200) {
        try { setRelays(JSON.parse(relayRes.body)); } catch { /* ignore */ }
      }
      if (timeslotRes.status === 200) {
        try { setTimeslots(JSON.parse(timeslotRes.body)); } catch { /* ignore */ }
      }
      if (settingsRes.status === 200) {
        try {
          const settings = JSON.parse(settingsRes.body);
          if (settings.relayGroups) setRelayGroups(settings.relayGroups);
        } catch { /* ignore */ }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleToggleRelay(relayId: number, currentState: number) {
    setTogglingRelay(relayId);
    const newState = currentState === 1 ? 0 : 1;
    const res = await updateRelay(relayId, newState);
    if (res.status === 200) {
      setRelays((prev) =>
        prev.map((r) => (r.id === relayId ? { ...r, state: newState } : r))
      );
    }
    setTogglingRelay(null);
  }

  async function handleToggleMode(courtId: string, currentMode: string) {
    setTogglingMode(courtId);
    const newMode = currentMode === 'external' ? 'manual' : 'external';
    // Fetch full current settings to avoid overwriting other fields
    let fullSettings: Record<string, unknown> = {};
    const currentRes = await getSettings();
    if (currentRes.status === 200) {
      try { fullSettings = JSON.parse(currentRes.body); } catch { /* ignore */ }
    }
    const currentGroups = (fullSettings.relayGroups as Record<string, RelayGroupSettings>) || relayGroups;
    const updatedGroups = { ...currentGroups, [courtId]: { ...currentGroups[courtId], mode: newMode } };
    const res = await patchSettings({ ...fullSettings, relayGroups: updatedGroups });
    if (res.status === 200) {
      setRelayGroups(updatedGroups);
    }
    setTogglingMode(null);
  }

  function getNextBooking(courtId: string): Timeslot | undefined {
    const now = new Date();
    return timeslots
      .filter((ts) => ts.relayGroupId === courtId && new Date(ts.timeFrom) > now)
      .sort((a, b) => new Date(a.timeFrom).getTime() - new Date(b.timeFrom).getTime())[0];
  }

  const now = new Date();

  return (
    <div className="p-6">
      {/* Status bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Sunrise className="h-4 w-4" />
            <span>6:29 AM</span>
          </div>
          <span>{format(now, 'EEE, dd MMM HH:mm')}</span>
          <div className="flex items-center gap-1">
            <Sunset className="h-4 w-4" />
            <span>5:59 PM</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`mr-1 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Court cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {COURTS.map((court) => {
          const courtRelays = relays.filter((r) => court.relays.includes(r.id));
          const nextBooking = getNextBooking(court.id);
          const anyOn = courtRelays.some((r) => r.state === 1);

          const courtMode = relayGroups[court.id]?.mode || 'external';
          const isManual = courtMode === 'manual';

          return (
            <Card key={court.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{court.name}</CardTitle>
                  <Badge variant={anyOn ? 'default' : 'secondary'}>
                    {anyOn ? 'Lights On' : 'Lights Off'}
                  </Badge>
                </div>

                {/* Mode toggle: Manual / Bookings (Auto) */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex rounded-md border text-xs">
                    <button
                      className={`px-3 py-1.5 transition-colors ${isManual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      disabled={togglingMode === court.id}
                      onClick={() => !isManual && handleToggleMode(court.id, courtMode)}
                    >
                      Manual
                    </button>
                    <button
                      className={`px-3 py-1.5 transition-colors ${!isManual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      disabled={togglingMode === court.id}
                      onClick={() => isManual && handleToggleMode(court.id, courtMode)}
                    >
                      Bookings
                    </button>
                  </div>
                  {togglingMode === court.id && (
                    <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Bulb states */}
                <div className="mb-4 flex items-center gap-3">
                  {court.bulbs.map((bulb, idx) => {
                    const relay = courtRelays[idx];
                    const isOn = relay?.state === 1;
                    return (
                      <div key={bulb} className="flex items-center gap-2">
                        <Lightbulb
                          className={`h-5 w-5 ${isOn ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                        />
                        <span className="text-xs text-muted-foreground">Bulb {bulb}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Relay toggles */}
                <div className="space-y-2">
                  {court.relays.map((relayId, idx) => {
                    const relay = relays.find((r) => r.id === relayId);
                    const isOn = relay?.state === 1;
                    return (
                      <div key={relayId} className={`flex items-center justify-between text-sm ${!isManual ? 'opacity-50' : ''}`}>
                        <span>Bulb {court.bulbs[idx]} (Relay {relayId})</span>
                        <Switch
                          checked={isOn}
                          disabled={!isManual || togglingRelay === relayId}
                          onCheckedChange={() => handleToggleRelay(relayId, relay?.state ?? 0)}
                        />
                      </div>
                    );
                  })}
                  {!isManual && (
                    <p className="text-xs text-muted-foreground italic">Switch to Manual to control relays directly</p>
                  )}
                </div>

                {/* Next booking */}
                {nextBooking && (
                  <div className="mt-4 rounded-md bg-muted/50 p-3 text-sm">
                    <div className="text-xs font-medium text-muted-foreground">Next Booking</div>
                    <div className="mt-1">
                      {format(new Date(nextBooking.timeFrom), 'EEE HH:mm')} — {format(new Date(nextBooking.timeTo), 'HH:mm')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      By: {nextBooking.ownerFriendlyName}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
