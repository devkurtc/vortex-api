'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { KeyValuePair } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';

interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor({
  pairs,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: KeyValueEditorProps) {
  function updatePair(index: number, updates: Partial<KeyValuePair>) {
    const newPairs = pairs.map((p, i) => (i === index ? { ...p, ...updates } : p));
    onChange(newPairs);
  }

  function addPair() {
    onChange([...pairs, { key: '', value: '', enabled: true }]);
  }

  function removePair(index: number) {
    onChange(pairs.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-1">
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-2">
          <Switch
            checked={pair.enabled}
            onCheckedChange={(checked) => updatePair(i, { enabled: checked })}
            className="shrink-0"
          />
          <Input
            value={pair.key}
            onChange={(e) => updatePair(i, { key: e.target.value })}
            placeholder={keyPlaceholder}
            className="h-8 font-mono text-xs"
          />
          <Input
            value={pair.value}
            onChange={(e) => updatePair(i, { value: e.target.value })}
            placeholder={valuePlaceholder}
            className="h-8 font-mono text-xs"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removePair(i)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addPair} className="text-xs">
        <Plus className="mr-1 h-3 w-3" />
        Add
      </Button>
    </div>
  );
}
