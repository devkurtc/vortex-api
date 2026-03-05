'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COURTS } from '@/lib/constants';
import { getSettings, patchSettings } from '@/lib/services/vortexloop-api';
import { Save, MapPin, Settings2, Zap, Shield } from 'lucide-react';

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
    </div>
  );
}
