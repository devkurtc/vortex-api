'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { COURTS } from '@/lib/constants';
import { getSettings, patchSettings } from '@/lib/services/vortexloop-api';
import { useEnvironmentStore } from '@/lib/stores/environment-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Save, MapPin, Settings2, Zap, Shield, RotateCcw, Terminal, ChevronDown, ChevronRight, Info } from 'lucide-react';

interface AdvancedSettings {
  loglevel: string;
  keepAgendaHistoryForDays: number;
  runCleanJobEveryDays: number;
  timeslotMaxRangeInHours: number;
  antiflickerPeriodInMinutes: number;
}

interface SettingsData {
  latitude: number;
  longitude: number;
  sunlightAware: boolean;
  relayGroupDelayOff: number;
  relayGroups: Record<string, { mode: string; sunlightOffset: number }>;
  advanced: AdvancedSettings;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Reseed state
  const [reseedOpen, setReseedOpen] = useState(false);
  const [reseeding, setReseeding] = useState(false);
  const [reseedLogs, setReseedLogs] = useState<{ type: string; message: string; timestamp: string }[]>([]);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSettings();
      if (res.status === 200) {
        try { setSettings(JSON.parse(res.body)); } catch { /* ignore */ }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await patchSettings(settings);
      setSaveStatus(res.status === 200 ? 'success' : 'error');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }

  async function handleReseed() {
    setReseeding(true);
    setReseedLogs([]);

    const env = useEnvironmentStore.getState().getActiveEnvironment();
    let baseUrl = 'https://vltc.vortexloop.com/';
    if (env) {
      const sitedomain = env.variables.find((v) => v.key === 'sitedomain' && v.enabled);
      if (sitedomain?.value) baseUrl = sitedomain.value;
    }
    const token = useAuthStore.getState().getAccessToken();

    try {
      const res = await fetch('/api/reseed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, token }),
      });

      if (!res.body) {
        setReseedLogs((prev) => [...prev, { type: 'error', message: 'No response stream', timestamp: new Date().toISOString() }]);
        setReseeding(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const entry = JSON.parse(line.slice(6));
              setReseedLogs((prev) => [...prev, entry]);
            } catch { /* skip malformed */ }
          }
        }
      }
    } catch (err) {
      setReseedLogs((prev) => [...prev, {
        type: 'error',
        message: `Connection error: ${err instanceof Error ? err.message : 'Unknown'}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setReseeding(false);
    }
  }

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [reseedLogs]);

  function updateSetting<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  function updateAdvanced<K extends keyof AdvancedSettings>(key: K, value: AdvancedSettings[K]) {
    if (!settings) return;
    setSettings({
      ...settings,
      advanced: { ...settings.advanced, [key]: value },
    });
  }

  function updateCourtSetting(courtId: string, key: string, value: unknown) {
    if (!settings) return;
    setSettings({
      ...settings,
      relayGroups: {
        ...settings.relayGroups,
        [courtId]: { ...settings.relayGroups[courtId], [key]: value },
      },
    });
  }

  if (loading || !settings) {
    return <div className="p-6 text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Settings</h2>
        <div className="flex items-center gap-2">
          {saveStatus === 'success' && <span className="text-sm text-green-500">Saved!</span>}
          {saveStatus === 'error' && <span className="text-sm text-destructive">Save failed</span>}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-1 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Location & Sunlight */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Location &amp; Sunlight
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Latitude</Label>
              <Input
                type="number"
                step="0.000001"
                value={settings.latitude}
                onChange={(e) => updateSetting('latitude', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Longitude</Label>
              <Input
                type="number"
                step="0.000001"
                value={settings.longitude}
                onChange={(e) => updateSetting('longitude', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Sunlight Aware</Label>
              <p className="text-xs text-muted-foreground">Adjust lighting based on sunrise/sunset</p>
            </div>
            <Switch
              checked={settings.sunlightAware}
              onCheckedChange={(checked) => updateSetting('sunlightAware', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Relay Settings */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Relay Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Relay Group Delay Off (seconds)</Label>
            <p className="text-xs text-muted-foreground mb-1">Delay before turning off relay groups</p>
            <Input
              type="number"
              value={settings.relayGroupDelayOff}
              onChange={(e) => updateSetting('relayGroupDelayOff', parseInt(e.target.value) || 0)}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Per-court settings */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" />
            Court Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {COURTS.map((court) => {
            const courtSettings = settings.relayGroups?.[court.id] || { mode: 'external', sunlightOffset: 0 };
            return (
              <div key={court.id} className="rounded-md border p-3">
                <span className="text-sm font-medium">{court.name}</span>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Mode</Label>
                    <Select
                      value={courtSettings.mode}
                      onValueChange={(v) => updateCourtSetting(court.id, 'mode', v)}
                    >
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="external">External (Auto)</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Sunlight Offset</Label>
                    <Input
                      type="number"
                      value={courtSettings.sunlightOffset}
                      onChange={(e) => updateCourtSetting(court.id, 'sunlightOffset', parseInt(e.target.value) || 0)}
                      className="h-8 w-20"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      {settings.advanced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Advanced
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Log Level</Label>
                <Select
                  value={settings.advanced.loglevel}
                  onValueChange={(v) => updateAdvanced('loglevel', v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Keep Agenda History (days)</Label>
                <Input
                  type="number"
                  value={settings.advanced.keepAgendaHistoryForDays}
                  onChange={(e) => updateAdvanced('keepAgendaHistoryForDays', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Run Clean Job Every (days)</Label>
                <Input
                  type="number"
                  value={settings.advanced.runCleanJobEveryDays}
                  onChange={(e) => updateAdvanced('runCleanJobEveryDays', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Timeslot Max Range (hours)</Label>
                <Input
                  type="number"
                  value={settings.advanced.timeslotMaxRangeInHours}
                  onChange={(e) => updateAdvanced('timeslotMaxRangeInHours', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Anti-flicker Period (minutes)</Label>
                <p className="text-xs text-muted-foreground">Minimum time between relay state changes</p>
                <Input
                  type="number"
                  value={settings.advanced.antiflickerPeriodInMinutes}
                  onChange={(e) => updateAdvanced('antiflickerPeriodInMinutes', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agenda Reseed */}
      <Card className="mt-4 border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RotateCcw className="h-4 w-4" />
            Agenda Reset &amp; Reseed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Purge all scheduled relay jobs from the Agenda dashboard and re-fetch fresh timeslots
            from the VLTC external feed. The <strong>cleanDB</strong> job will be preserved.
          </p>

          {/* Collapsible technical explanation */}
          <div className="rounded-md border border-muted">
            <button
              type="button"
              onClick={() => setHowItWorksOpen(!howItWorksOpen)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {howItWorksOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <Info className="h-3 w-3" />
              How it works
            </button>
            {howItWorksOpen && (
              <div className="border-t px-3 pb-3 pt-2 text-xs text-muted-foreground space-y-2">
                <p>This operation performs the following steps against the production VLTC system:</p>
                <ol className="list-decimal ml-4 space-y-1.5">
                  <li>
                    <strong className="text-foreground">Fetch jobs from Agendash</strong> &mdash; Calls the
                    Agenda dashboard API (<code className="text-amber-400/80">/dash/api</code>) to retrieve all
                    currently scheduled jobs.
                  </li>
                  <li>
                    <strong className="text-foreground">Delete setRelayGroup jobs</strong> &mdash; Filters out the
                    recurring <code className="text-amber-400/80">cleanDB</code> housekeeping job and bulk-deletes
                    all <code className="text-amber-400/80">setRelayGroup</code> jobs. This clears the entire
                    relay schedule.
                  </li>
                  <li>
                    <strong className="text-foreground">Fetch fresh timeslots</strong> &mdash; Calls the VLTC
                    external feed (<code className="text-amber-400/80">vltc.com.mt/timeslots/TimeSlot</code>)
                    using the configured API key to get the latest court booking schedule.
                  </li>
                  <li>
                    <strong className="text-foreground">Re-seed into Agenda</strong> &mdash; For each timeslot,
                    sends a <code className="text-amber-400/80">PUT /api/timeslots/:id</code> request to the VLTC
                    backend. The backend calculates sunlight-aware adjustments, applies anti-flicker rules, and
                    creates two Agenda jobs per timeslot: one for lights ON, one for lights OFF.
                  </li>
                </ol>
                <div className="mt-2 rounded bg-muted/50 px-2 py-1.5">
                  <p className="font-medium text-foreground">Safe to run:</p>
                  <ul className="list-disc ml-4 mt-1 space-y-0.5">
                    <li>The <code className="text-amber-400/80">cleanDB</code> job is never deleted</li>
                    <li>No relay hardware commands are sent during reseed</li>
                    <li>Relays will only be toggled when Agenda fires the newly scheduled jobs at their designated times</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <Dialog open={reseedOpen} onOpenChange={(open) => { if (!reseeding) setReseedOpen(open); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-amber-500/40 text-amber-500 hover:bg-amber-500/10">
                <RotateCcw className="mr-1 h-4 w-4" />
                Reset &amp; Reseed Agenda
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl" showCloseButton={!reseeding}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  {reseeding ? 'Reseeding in progress...' : reseedLogs.length > 0 ? 'Reseed Complete' : 'Confirm Reset & Reseed'}
                </DialogTitle>
                <DialogDescription>
                  {reseedLogs.length === 0 && !reseeding
                    ? 'This will delete ALL setRelayGroup jobs and re-fetch timeslots from the VLTC feed. The cleanDB job will NOT be touched.'
                    : 'Live output from the reseed operation:'}
                </DialogDescription>
              </DialogHeader>

              {/* Console output */}
              {(reseeding || reseedLogs.length > 0) && (
                <div className="rounded-md border bg-black/80 p-3 font-mono text-xs max-h-80 overflow-y-auto">
                  {reseedLogs.map((log, i) => (
                    <div key={i} className="flex gap-2 py-0.5">
                      <span className="text-muted-foreground shrink-0 w-20">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-green-400' :
                        log.type === 'warn' ? 'text-amber-400' :
                        'text-blue-300'
                      }>
                        {log.type === 'error' ? 'ERR' :
                         log.type === 'success' ? 'OK ' :
                         log.type === 'warn' ? 'WRN' : 'INF'}
                      </span>
                      <span className="text-gray-200">{log.message}</span>
                    </div>
                  ))}
                  {reseeding && (
                    <div className="flex gap-2 py-0.5">
                      <span className="text-muted-foreground shrink-0 w-20">&nbsp;</span>
                      <span className="text-blue-300 animate-pulse">...</span>
                    </div>
                  )}
                  <div ref={consoleEndRef} />
                </div>
              )}

              <DialogFooter>
                {reseedLogs.length === 0 && !reseeding && (
                  <>
                    <Button variant="outline" onClick={() => setReseedOpen(false)}>Cancel</Button>
                    <Button
                      variant="destructive"
                      onClick={handleReseed}
                    >
                      Yes, Reset &amp; Reseed
                    </Button>
                  </>
                )}
                {!reseeding && reseedLogs.length > 0 && (
                  <Button variant="outline" onClick={() => { setReseedOpen(false); setReseedLogs([]); }}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
