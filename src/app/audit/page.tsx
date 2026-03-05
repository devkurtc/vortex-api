'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JsonViewer } from '@/components/shared/json-viewer';
import { ModeToggle } from '@/components/shared/mode-toggle';
import { METHOD_BG_COLORS, getStatusColor } from '@/lib/constants';
import type { AuditEntry, HttpMethod } from '@/lib/types';
import { format } from 'date-fns';
import { ArrowLeft, ChevronDown, ChevronRight, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [urlFilter, setUrlFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState('');

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (urlFilter) params.set('url', urlFilter);
      if (methodFilter && methodFilter !== 'all') params.set('method', methodFilter);
      if (userFilter) params.set('user', userFilter);
      params.set('limit', '200');

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (res.ok) {
        setEntries(await res.json());
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [urlFilter, methodFilter, userFilter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-lg font-semibold">Audit Trail</h1>
        </div>
        <ModeToggle />
      </header>

      {/* Filters */}
      <div className="flex items-center gap-3 border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by URL..."
            value={urlFilter}
            onChange={(e) => setUrlFilter(e.target.value)}
            className="h-8 w-60"
          />
        </div>
        <Input
          placeholder="User..."
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="h-8 w-32"
        />
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="h-8 w-28">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchEntries} className="h-8">
          <RefreshCw className="mr-1 h-3 w-3" />
          Refresh
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          {entries.length} entries
        </span>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <div className="min-w-full">
          {/* Header row */}
          <div className="sticky top-0 grid grid-cols-[80px_100px_1fr_80px_80px_100px_40px] gap-2 border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
            <div>Method</div>
            <div>User</div>
            <div>URL</div>
            <div>Status</div>
            <div>Duration</div>
            <div>Timestamp</div>
            <div></div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading audit log...</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No audit entries yet. Make some API requests to see them here.
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id}>
                <div
                  className="grid cursor-pointer grid-cols-[80px_100px_1fr_80px_80px_100px_40px] items-center gap-2 border-b px-4 py-2 text-sm hover:bg-muted/30"
                  onClick={() => setExpandedId(expandedId === entry.id! ? null : entry.id!)}
                >
                  <Badge variant="outline" className={METHOD_BG_COLORS[entry.method as HttpMethod] || ''}>
                    {entry.method}
                  </Badge>
                  <span className="truncate text-muted-foreground">{entry.user}</span>
                  <span className="truncate font-mono text-xs">{entry.url}</span>
                  <span className={getStatusColor(entry.status)}>{entry.status}</span>
                  <span className="text-muted-foreground">{entry.duration}ms</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.timestamp), 'HH:mm:ss')}
                  </span>
                  <div>
                    {expandedId === entry.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === entry.id && (
                  <div className="border-b bg-muted/20 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Request Body</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {entry.request_body ? (
                            <JsonViewer data={entry.request_body} maxHeight="200px" />
                          ) : (
                            <span className="text-sm text-muted-foreground">No request body</span>
                          )}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Response Body</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {entry.response_body ? (
                            <JsonViewer data={entry.response_body} maxHeight="200px" />
                          ) : (
                            <span className="text-sm text-muted-foreground">No response body</span>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                      <span>Mode: {entry.mode}</span>
                      <span>Full timestamp: {entry.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
