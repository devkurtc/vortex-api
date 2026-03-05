'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JsonViewer } from '@/components/shared/json-viewer';
import { getStatusColor } from '@/lib/constants';
import type { ApiResponse } from '@/lib/types';
import { Copy, Check, FileCode2 } from 'lucide-react';
import { useState } from 'react';

interface ResponseViewerProps {
  response: ApiResponse | null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResponseViewer({ response }: ResponseViewerProps) {
  const [copied, setCopied] = useState(false);

  if (!response) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">Send a request to see the response</p>
          <p className="mt-1 text-xs">Ctrl+Enter to send</p>
        </div>
      </div>
    );
  }

  async function copyBody() {
    if (!response) return;
    await navigator.clipboard.writeText(response.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statusColorClass = getStatusColor(response.status);

  return (
    <div className="flex h-full flex-col">
      {/* Status bar */}
      <div className="flex items-center gap-3 border-b px-3 py-2">
        <span className="text-sm font-medium">Response</span>
        {response.status > 0 ? (
          <>
            <Badge variant="outline" className={statusColorClass}>
              {response.status} {response.statusText}
            </Badge>
            <span className="text-xs text-muted-foreground">{response.duration}ms</span>
            <span className="text-xs text-muted-foreground">{formatSize(response.size)}</span>
          </>
        ) : (
          <Badge variant="destructive">Error</Badge>
        )}
        <div className="ml-auto">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyBody}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Body / Headers */}
      <Tabs defaultValue="body" className="flex-1">
        <TabsList className="mx-3 mt-1">
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">
            Headers
            <span className="ml-1 text-xs text-muted-foreground">
              ({Object.keys(response.headers).length})
            </span>
          </TabsTrigger>
          {response.scriptResult && (
            <TabsTrigger value="scripts">
              Scripts
              {response.scriptResult.variablesSet.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {response.scriptResult.variablesSet.length}
                </Badge>
              )}
              {response.scriptResult.error && (
                <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                  !
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="body" className="flex-1 overflow-auto px-3 pb-3">
          <JsonViewer data={response.body} maxHeight="100%" />
        </TabsContent>
        <TabsContent value="headers" className="px-3 pb-3">
          <div className="space-y-1">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-xs">
                <span className="font-medium text-foreground">{key}:</span>
                <span className="font-mono text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>
        {response.scriptResult && (
          <TabsContent value="scripts" className="px-3 pb-3">
            <div className="space-y-2">
              {/* Summary */}
              <div className="flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {response.scriptResult.success ? 'Script completed' : 'Script failed'}
                  {response.scriptResult.variablesSet.length > 0 &&
                    ` — ${response.scriptResult.variablesSet.length} variable${response.scriptResult.variablesSet.length !== 1 ? 's' : ''} set`}
                </span>
              </div>

              {/* Error */}
              {response.scriptResult.error && (
                <div className="rounded border border-destructive/50 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
                  {response.scriptResult.error}
                </div>
              )}

              {/* Variables set */}
              {response.scriptResult.variablesSet.length > 0 && (
                <div className="space-y-1">
                  {response.scriptResult.variablesSet.map((v, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                        SET
                      </Badge>
                      <span className="font-medium text-foreground">{v.key}</span>
                      <span className="truncate font-mono text-muted-foreground" title={v.value}>
                        {v.value.length > 80 ? v.value.slice(0, 80) + '…' : v.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
