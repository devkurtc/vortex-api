// ─── HTTP Types ───────────────────────────────────────────────

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type AuthType = 'none' | 'bearer' | 'apikey' | 'inherit';

export interface AuthConfig {
  type: AuthType;
  bearerToken?: string;
  apiKeyHeader?: string;
  apiKeyValue?: string;
}

export interface KeyValuePair {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export type BodyMode = 'none' | 'raw' | 'urlencoded' | 'formdata';

export interface RequestBody {
  mode: BodyMode;
  raw?: string;
  urlencoded?: KeyValuePair[];
  formdata?: KeyValuePair[];
}

// ─── Collection Types ─────────────────────────────────────────

export interface ApiRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  auth: AuthConfig;
  body: RequestBody;
  preRequestScript?: string;
  testScript?: string;
  description?: string;
}

export interface CollectionFolder {
  id: string;
  name: string;
  requests: string[]; // request IDs
  auth?: AuthConfig;
}

export interface Collection {
  id: string;
  name: string;
  folders: CollectionFolder[];
  requests: ApiRequest[];
}

// ─── Environment Types ────────────────────────────────────────

export interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

// ─── Response Types ───────────────────────────────────────────

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  size: number;
  duration: number;
  timestamp: string;
}

// ─── History Types ────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  request: {
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  response: ApiResponse;
  timestamp: string;
}

// ─── Auth/Token Types ─────────────────────────────────────────

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  obtained_at: number; // timestamp when token was obtained
}

export interface DecodedJwt {
  exp: number;
  iat: number;
  preferred_username?: string;
  email?: string;
  sub?: string;
  realm_access?: {
    roles: string[];
  };
  [key: string]: unknown;
}

// ─── Audit Types ──────────────────────────────────────────────

export interface AuditEntry {
  id?: number;
  timestamp: string;
  user: string;
  method: HttpMethod;
  url: string;
  status: number;
  request_body: string | null;
  response_body: string | null;
  request_headers: string | null;
  response_headers: string | null;
  mode: 'developer' | 'user' | 'system';
  duration: number;
}

export interface AuditFilters {
  user?: string;
  method?: HttpMethod;
  url?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: number;
  mode?: 'developer' | 'user' | 'system';
}

// ─── UI Types ─────────────────────────────────────────────────

export type AppMode = 'developer' | 'user';

export interface RequestTab {
  id: string;
  requestId: string;
  name: string;
  method: HttpMethod;
  isDirty: boolean;
}
