import type {
  Collection, CollectionFolder, ApiRequest, Environment,
  HttpMethod, AuthConfig, KeyValuePair, RequestBody,
} from '@/lib/types';

/**
 * Parse the scraped VortexLoop Postman export format into our internal types.
 */

interface RawExport {
  collections: RawCollection[];
  folders: RawFolder[];
  requests: RawRequest[];
  environments: RawEnvironment[];
}

interface RawCollection {
  name: string;
  id: string;
  folders_order: string[];
  order: string[];
}

interface RawFolder {
  id: string;
  name: string;
  order: string[];
  folders_order: string[];
}

interface RawRequest {
  collection: string;
  folder: string | null;
  name: string;
  method: string;
  url: string;
  dataMode: string | null;
  data: RawKVPair[] | null;
  rawModeData: string | null;
  auth: RawAuth | null;
  headerData: RawHeaderData[];
  headers: string;
  queryParams: RawKVPair[];
  events: RawEvent[] | null;
  tests: string | null;
  preRequestScript: string | null;
  description: string | null;
}

interface RawKVPair {
  key: string;
  value: string;
  type?: string;
  description?: string;
  enabled?: boolean;
}

interface RawAuth {
  type: string;
  bearer?: { key: string; value: string; type: string }[];
  apikey?: { key: string; value: string; type: string }[];
}

interface RawHeaderData {
  key: string;
  value: string;
  description: string | null;
  type: string;
  enabled: boolean;
}

interface RawEvent {
  listen: string;
  script: { exec: string[]; type: string };
}

interface RawEnvironment {
  name: string;
  values: { key: string; value: string; enabled: boolean }[];
}

function parseAuth(raw: RawAuth | null): AuthConfig {
  if (!raw) return { type: 'none' };

  if (raw.type === 'bearer') {
    const tokenEntry = raw.bearer?.find((b) => b.key === 'token');
    return {
      type: 'bearer',
      bearerToken: tokenEntry?.value || '{{access_token}}',
    };
  }

  if (raw.type === 'apikey') {
    const keyEntry = raw.apikey?.find((b) => b.key === 'key');
    const valueEntry = raw.apikey?.find((b) => b.key === 'value');
    return {
      type: 'apikey',
      apiKeyHeader: keyEntry?.value || 'X-API-KEY',
      apiKeyValue: valueEntry?.value || '',
    };
  }

  return { type: 'none' };
}

function parseBody(dataMode: string | null, data: RawKVPair[] | null, rawModeData: string | null): RequestBody {
  if (dataMode === 'raw' && rawModeData) {
    return { mode: 'raw', raw: rawModeData.replace(/\r\n/g, '\n').replace(/\r/g, '\n') };
  }

  if (dataMode === 'urlencoded' && data) {
    return {
      mode: 'urlencoded',
      urlencoded: data.map((d) => ({
        key: d.key,
        value: d.value,
        description: d.description,
        enabled: d.enabled !== false,
      })),
    };
  }

  return { mode: 'none' };
}

function parseTestScript(events: RawEvent[] | null, tests: string | null): string | undefined {
  if (events) {
    const testEvent = events.find((e) => e.listen === 'test');
    if (testEvent?.script?.exec) {
      return testEvent.script.exec.join('\n').replace(/\r/g, '');
    }
  }
  if (tests) {
    return tests.replace(/\r/g, '');
  }
  return undefined;
}

export function importFromCustomExport(data: RawExport): {
  collections: Collection[];
  environments: Environment[];
} {
  const rawCollections = data.collections;
  const rawFolders = data.folders;
  const rawRequests = data.requests;

  const collections: Collection[] = rawCollections.map((rawCol) => {
    // Find folders for this collection
    const folderIds = rawCol.folders_order;
    const folders: CollectionFolder[] = folderIds.map((folderId) => {
      const rawFolder = rawFolders.find((f) => f.id === folderId);
      if (!rawFolder) return null;
      return {
        id: rawFolder.id,
        name: rawFolder.name,
        requests: rawFolder.order,
      };
    }).filter(Boolean) as CollectionFolder[];

    // Find requests belonging to this collection
    const requests: ApiRequest[] = rawRequests
      .filter((r) => r.collection === rawCol.name)
      .map((r) => ({
        id: crypto.randomUUID(),
        name: r.name,
        method: (r.method || 'GET') as HttpMethod,
        url: r.url || '',
        headers: r.headerData
          .filter((h) => h.enabled)
          .map((h) => ({
            key: h.key,
            value: h.value,
            description: h.description || undefined,
            enabled: true,
          })),
        params: r.queryParams?.map((q) => ({
          key: q.key,
          value: q.value,
          enabled: true,
        })) || [],
        auth: parseAuth(r.auth),
        body: parseBody(r.dataMode, r.data, r.rawModeData),
        testScript: parseTestScript(r.events, r.tests),
        preRequestScript: r.preRequestScript || undefined,
        description: r.description || undefined,
      }));

    // Map folder request names to generated IDs
    // The raw folder.order contains old Postman IDs that don't match.
    // We match by position: requests in a folder are those whose rawRequest.folder matches.
    const folderRequestMap = new Map<string, ApiRequest[]>();
    rawRequests
      .filter((r) => r.collection === rawCol.name && r.folder)
      .forEach((r) => {
        if (!folderRequestMap.has(r.folder!)) {
          folderRequestMap.set(r.folder!, []);
        }
        const matchingReq = requests.find((req) => req.name === r.name && req.method === r.method);
        if (matchingReq) {
          folderRequestMap.get(r.folder!)!.push(matchingReq);
        }
      });

    // Update folder request IDs
    const updatedFolders = folders.map((f) => ({
      ...f,
      requests: (folderRequestMap.get(f.name) || []).map((r) => r.id),
    }));

    return {
      id: rawCol.id,
      name: rawCol.name,
      folders: updatedFolders,
      requests,
    };
  });

  const environments: Environment[] = data.environments.map((rawEnv) => ({
    id: crypto.randomUUID(),
    name: rawEnv.name,
    variables: rawEnv.values.map((v) => ({
      key: v.key,
      value: v.value,
      enabled: v.enabled,
    })),
  }));

  return { collections, environments };
}
