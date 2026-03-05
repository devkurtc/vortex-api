'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UrlBar } from './url-bar';
import { KeyValueEditor } from './key-value-editor';
import { useCollectionStore } from '@/lib/stores/collection-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { executeRequest } from '@/lib/engine/request-executor';
import type { ApiRequest, AuthType, BodyMode, KeyValuePair } from '@/lib/types';

interface RequestBuilderProps {
  collectionId: string;
  requestId: string;
}

export function RequestBuilder({ collectionId, requestId }: RequestBuilderProps) {
  // Subscribe to the actual request data so we re-render when it changes
  const request = useCollectionStore((s) => {
    const col = s.collections.find((c) => c.id === collectionId);
    return col?.requests.find((r) => r.id === requestId);
  });
  const updateRequest = useCollectionStore((s) => s.updateRequest);
  const setResponse = useUiStore((s) => s.setResponse);
  const activeTab = useUiStore((s) => s.activeTab);
  const addHistoryEntry = useUiStore((s) => s.addHistoryEntry);

  const [loading, setLoading] = useState(false);

  if (!request) {
    return <div className="p-4 text-muted-foreground">Request not found</div>;
  }

  function update(updates: Partial<ApiRequest>) {
    updateRequest(collectionId, requestId, updates);
  }

  async function handleSend() {
    if (!request) return;
    setLoading(true);

    try {
      // Read the latest request state at send time
      const latestRequest = useCollectionStore.getState().collections
        .find((c) => c.id === collectionId)?.requests
        .find((r) => r.id === requestId);

      if (!latestRequest) return;

      const response = await executeRequest(latestRequest, { mode: 'developer' });

      if (activeTab) {
        setResponse(activeTab, response);
      }

      addHistoryEntry({
        id: crypto.randomUUID(),
        request: {
          method: latestRequest.method,
          url: latestRequest.url,
          headers: Object.fromEntries(
            latestRequest.headers.filter((h) => h.enabled).map((h) => [h.key, h.value])
          ),
          body: latestRequest.body.raw || undefined,
        },
        response,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <UrlBar
        method={request.method}
        url={request.url}
        loading={loading}
        onMethodChange={(method) => update({ method })}
        onUrlChange={(url) => update({ url })}
        onSend={handleSend}
      />

      <Tabs defaultValue="body" className="w-full">
        <TabsList>
          <TabsTrigger value="params">
            Params
            {request.params.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">({request.params.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
          <TabsTrigger value="headers">
            Headers
            {request.headers.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">({request.headers.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
        </TabsList>

        <TabsContent value="params" className="mt-2">
          <KeyValueEditor
            pairs={request.params}
            onChange={(params) => update({ params })}
            keyPlaceholder="Parameter"
            valuePlaceholder="Value"
          />
        </TabsContent>

        <TabsContent value="auth" className="mt-2">
          <AuthEditor
            type={request.auth.type}
            bearerToken={request.auth.bearerToken}
            apiKeyHeader={request.auth.apiKeyHeader}
            apiKeyValue={request.auth.apiKeyValue}
            onChange={(auth) => update({ auth: { ...request.auth, ...auth } })}
          />
        </TabsContent>

        <TabsContent value="headers" className="mt-2">
          <KeyValueEditor
            pairs={request.headers}
            onChange={(headers) => update({ headers })}
          />
        </TabsContent>

        <TabsContent value="body" className="mt-2">
          <BodyEditor
            mode={request.body.mode}
            raw={request.body.raw}
            urlencoded={request.body.urlencoded}
            onModeChange={(mode) => update({ body: { ...request.body, mode } })}
            onRawChange={(raw) => update({ body: { ...request.body, raw } })}
            onUrlencodedChange={(urlencoded) => update({ body: { ...request.body, urlencoded } })}
          />
        </TabsContent>

        <TabsContent value="scripts" className="mt-2">
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Post-response Script</Label>
              <Textarea
                value={request.testScript || ''}
                onChange={(e) => update({ testScript: e.target.value })}
                placeholder="var jsonData = pm.response.json();&#10;pm.globals.set('access_token', jsonData.access_token);"
                className="mt-1 min-h-[120px] font-mono text-xs"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AuthEditor({
  type,
  bearerToken,
  apiKeyHeader,
  apiKeyValue,
  onChange,
}: {
  type: AuthType;
  bearerToken?: string;
  apiKeyHeader?: string;
  apiKeyValue?: string;
  onChange: (updates: Partial<ApiRequest['auth']>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Auth Type</Label>
        <Select value={type} onValueChange={(v) => onChange({ type: v as AuthType })}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Auth</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="apikey">API Key</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === 'bearer' && (
        <div>
          <Label className="text-xs">Token</Label>
          <Input
            value={bearerToken || ''}
            onChange={(e) => onChange({ bearerToken: e.target.value })}
            placeholder="{{access_token}}"
            className="mt-1 font-mono text-xs"
          />
        </div>
      )}

      {type === 'apikey' && (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Header Name</Label>
            <Input
              value={apiKeyHeader || ''}
              onChange={(e) => onChange({ apiKeyHeader: e.target.value })}
              placeholder="X-API-KEY"
              className="mt-1 font-mono text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">API Key Value</Label>
            <Input
              value={apiKeyValue || ''}
              onChange={(e) => onChange({ apiKeyValue: e.target.value })}
              placeholder="your-api-key"
              className="mt-1 font-mono text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BodyEditor({
  mode,
  raw,
  urlencoded,
  onModeChange,
  onRawChange,
  onUrlencodedChange,
}: {
  mode: BodyMode;
  raw?: string;
  urlencoded?: KeyValuePair[];
  onModeChange: (mode: BodyMode) => void;
  onRawChange: (raw: string) => void;
  onUrlencodedChange: (pairs: KeyValuePair[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {(['none', 'raw', 'urlencoded'] as const).map((m) => (
          <label key={m} className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="bodyMode"
              checked={mode === m}
              onChange={() => onModeChange(m)}
              className="accent-primary"
            />
            {m === 'none' ? 'None' : m === 'raw' ? 'Raw (JSON)' : 'x-www-form-urlencoded'}
          </label>
        ))}
      </div>

      {mode === 'raw' && (
        <Textarea
          value={raw || ''}
          onChange={(e) => onRawChange(e.target.value)}
          placeholder="{}"
          className="min-h-[200px] font-mono text-xs"
        />
      )}

      {mode === 'urlencoded' && (
        <KeyValueEditor
          pairs={urlencoded || []}
          onChange={onUrlencodedChange}
        />
      )}
    </div>
  );
}
