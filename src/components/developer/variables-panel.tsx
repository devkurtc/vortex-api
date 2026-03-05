'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEnvironmentStore } from '@/lib/stores/environment-store';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUiStore } from '@/lib/stores/ui-store';
import {
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  X,
  Terminal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Globals Tab ──────────────────────────────────────────────

function GlobalsTab() {
  const globalVariables = useEnvironmentStore((s) => s.globalVariables);
  const removeGlobalVariable = useEnvironmentStore((s) => s.removeGlobalVariable);
  const clearGlobalVariables = useEnvironmentStore((s) => s.clearGlobalVariables);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const entries = Object.entries(globalVariables);

  function toggleReveal(key: string) {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function copyValue(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function maskValue(value: string): string {
    if (value.length <= 8) return '••••••••';
    return value.slice(0, 4) + '••••••••' + value.slice(-4);
  }

  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-8 text-xs text-muted-foreground">
        No global variables set. Run a script with pm.globals.set() to populate.
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-end px-1 pb-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-muted-foreground"
          onClick={clearGlobalVariables}
        >
          Clear all
        </Button>
      </div>
      {entries.map(([key, value]) => {
        const isRevealed = revealedKeys.has(key);
        const isToken = key.toLowerCase().includes('token') || key.toLowerCase().includes('secret');
        const displayValue = isToken && !isRevealed ? maskValue(value) : value;

        return (
          <div
            key={key}
            className="group flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/50"
          >
            <span className="min-w-[120px] shrink-0 text-xs font-medium text-foreground">
              {key}
            </span>
            <span
              className={cn(
                'flex-1 truncate font-mono text-xs',
                isToken && !isRevealed ? 'text-muted-foreground' : 'text-foreground'
              )}
              title={isRevealed || !isToken ? value : undefined}
            >
              {displayValue}
            </span>
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              {isToken && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => toggleReveal(key)}
                  title={isRevealed ? 'Hide value' : 'Reveal value'}
                >
                  {isRevealed ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyValue(key, value)}
                title="Copy value"
              >
                {copiedKey === key ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => removeGlobalVariable(key)}
                title="Remove variable"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Environment Tab ──────────────────────────────────────────

function EnvironmentTab() {
  const activeEnv = useEnvironmentStore((s) => s.getActiveEnvironment());
  const updateEnvironment = useEnvironmentStore((s) => s.updateEnvironment);

  if (!activeEnv) {
    return (
      <div className="flex h-full items-center justify-center py-8 text-xs text-muted-foreground">
        No active environment selected. Use the environment switcher above.
      </div>
    );
  }

  function updateVariable(index: number, updates: Partial<{ key: string; value: string; enabled: boolean }>) {
    if (!activeEnv) return;
    const newVars = activeEnv.variables.map((v, i) =>
      i === index ? { ...v, ...updates } : v
    );
    updateEnvironment(activeEnv.id, { variables: newVars });
  }

  function addVariable() {
    if (!activeEnv) return;
    updateEnvironment(activeEnv.id, {
      variables: [...activeEnv.variables, { key: '', value: '', enabled: true }],
    });
  }

  function removeVariable(index: number) {
    if (!activeEnv) return;
    updateEnvironment(activeEnv.id, {
      variables: activeEnv.variables.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="space-y-1">
      <div className="mb-1 flex items-center gap-2 px-1">
        <Badge variant="outline" className="text-xs">
          {activeEnv.name}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {activeEnv.variables.filter((v) => v.enabled).length} active
        </span>
      </div>
      {activeEnv.variables.map((variable, i) => (
        <div key={i} className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            checked={variable.enabled}
            onChange={(e) => updateVariable(i, { enabled: e.target.checked })}
            className="h-3 w-3 shrink-0"
          />
          <Input
            value={variable.key}
            onChange={(e) => updateVariable(i, { key: e.target.value })}
            placeholder="Key"
            className="h-7 font-mono text-xs"
          />
          <Input
            value={variable.value}
            onChange={(e) => updateVariable(i, { value: e.target.value })}
            placeholder="Value"
            className="h-7 font-mono text-xs"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => removeVariable(i)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addVariable} className="text-xs">
        <Plus className="mr-1 h-3 w-3" />
        Add
      </Button>
    </div>
  );
}

// ─── Console Tab ──────────────────────────────────────────────

function ConsoleTab() {
  const entries = useConsoleStore((s) => s.entries);
  const clear = useConsoleStore((s) => s.clear);

  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-8 text-xs text-muted-foreground">
        <div className="text-center">
          <Terminal className="mx-auto mb-2 h-5 w-5 opacity-30" />
          <p>Script output will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-end px-1 pb-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-muted-foreground"
          onClick={clear}
        >
          Clear
        </Button>
      </div>
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={cn(
            'flex items-start gap-2 border-b border-border/50 px-2 py-1 font-mono text-xs',
            entry.type === 'script-error' && 'bg-destructive/5 text-destructive',
            entry.type === 'script-set' && 'text-foreground',
            entry.type === 'info' && 'text-muted-foreground'
          )}
        >
          <span className="shrink-0 text-muted-foreground">
            {new Date(entry.timestamp).toLocaleTimeString()}
          </span>
          <span className="flex-1">
            {entry.message}
            {entry.detail && (
              <span className="ml-1 text-muted-foreground">
                → {entry.detail.length > 60
                  ? entry.detail.slice(0, 60) + '…'
                  : entry.detail}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────

export function VariablesPanel() {
  const isOpen = useUiStore((s) => s.variablesPanelOpen);
  const togglePanel = useUiStore((s) => s.toggleVariablesPanel);
  const globalCount = useEnvironmentStore((s) => Object.keys(s.globalVariables).length);
  const consoleCount = useConsoleStore((s) => s.entries.length);
  const activeEnv = useEnvironmentStore((s) => s.getActiveEnvironment());
  const envCount = activeEnv?.variables.filter((v) => v.enabled).length ?? 0;

  return (
    <div className="border-t bg-background">
      {/* Toggle bar — always visible */}
      <button
        onClick={togglePanel}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )}
        <span className="font-medium">Variables & Console</span>
        {globalCount > 0 && (
          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
            {globalCount} globals
          </Badge>
        )}
        {envCount > 0 && (
          <Badge variant="outline" className="h-4 px-1 text-[10px]">
            {envCount} env
          </Badge>
        )}
        {consoleCount > 0 && (
          <Badge variant="outline" className="h-4 px-1 text-[10px]">
            {consoleCount} log{consoleCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </button>

      {/* Expandable content */}
      {isOpen && (
        <div className="h-[220px] overflow-auto border-t">
          <Tabs defaultValue="globals" className="h-full">
            <TabsList className="mx-3 mt-1">
              <TabsTrigger value="globals">
                Globals
                {globalCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {globalCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="environment">
                Environment
                {envCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {envCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="console">
                Console
                {consoleCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {consoleCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="globals" className="overflow-auto px-3 pb-3">
              <GlobalsTab />
            </TabsContent>
            <TabsContent value="environment" className="overflow-auto px-3 pb-3">
              <EnvironmentTab />
            </TabsContent>
            <TabsContent value="console" className="overflow-auto px-3 pb-3">
              <ConsoleTab />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
