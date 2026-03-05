import type { ApiRequest, ApiResponse, HttpMethod, AppMode } from '@/lib/types';
import { resolveVariables } from './variable-resolver';
import { runPostResponseScript } from './script-runner';
import { ensureValidToken, refreshAccessToken } from './token-manager';
import { useEnvironmentStore } from '@/lib/stores/environment-store';
import { useAuthStore } from '@/lib/stores/auth-store';

interface ExecuteOptions {
  mode: AppMode;
  extraVariables?: Record<string, string>;
  skipAudit?: boolean;
}

/**
 * Route an external HTTP request through our server-side proxy to avoid CORS.
 * The proxy at /api/proxy forwards the request server-side and returns the response.
 */
async function proxyFetch(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): Promise<{ status: number; statusText: string; headers: Record<string, string>; body: string }> {
  const proxyRes = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, method, headers, body }),
  });

  const data = await proxyRes.json();

  if (!proxyRes.ok && !data.status) {
    return {
      status: proxyRes.status,
      statusText: data.error || proxyRes.statusText,
      headers: {},
      body: JSON.stringify(data),
    };
  }

  return {
    status: data.status,
    statusText: data.statusText || '',
    headers: data.headers || {},
    body: data.body || '',
  };
}

/**
 * Core request execution engine.
 * Resolves variables, injects auth, executes via proxy, runs post-scripts, logs audit.
 */
export async function executeRequest(
  request: ApiRequest,
  options: ExecuteOptions
): Promise<ApiResponse> {
  const envStore = useEnvironmentStore.getState();
  const variables = { ...envStore.getAllVariables(), ...options.extraVariables };

  // Resolve URL
  const resolvedUrl = resolveVariables(request.url, variables);

  // Build headers
  const headers: Record<string, string> = {};

  for (const h of request.headers) {
    if (h.enabled) {
      headers[resolveVariables(h.key, variables)] = resolveVariables(h.value, variables);
    }
  }

  // Add auth
  if (request.auth.type === 'bearer') {
    const token = resolveVariables(request.auth.bearerToken || '{{access_token}}', variables);
    headers['Authorization'] = `Bearer ${token}`;
  } else if (request.auth.type === 'apikey') {
    const headerName = request.auth.apiKeyHeader || 'X-API-KEY';
    headers[headerName] = resolveVariables(request.auth.apiKeyValue || '', variables);
  }

  // Build body
  let body: string | undefined;
  if (request.body.mode === 'raw' && request.body.raw) {
    body = resolveVariables(request.body.raw, variables);
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  } else if (request.body.mode === 'urlencoded' && request.body.urlencoded) {
    const params = new URLSearchParams();
    for (const p of request.body.urlencoded) {
      if (p.enabled) {
        params.set(resolveVariables(p.key, variables), resolveVariables(p.value, variables));
      }
    }
    body = params.toString();
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  // Execute via proxy
  const start = performance.now();

  let result: ApiResponse;
  try {
    const proxyResult = await proxyFetch(resolvedUrl, request.method, headers, body);
    const duration = Math.round(performance.now() - start);

    result = {
      status: proxyResult.status,
      statusText: proxyResult.statusText,
      headers: proxyResult.headers,
      body: proxyResult.body,
      size: new Blob([proxyResult.body]).size,
      duration,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      status: 0,
      statusText: err instanceof Error ? err.message : 'Network Error',
      headers: {},
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Network Error' }),
      size: 0,
      duration: Math.round(performance.now() - start),
      timestamp: new Date().toISOString(),
    };
  }

  // Handle 401 — try refresh + retry once
  if (result.status === 401 && request.auth.type === 'bearer') {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = useAuthStore.getState().getAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryStart = performance.now();
        try {
          const retryResult = await proxyFetch(resolvedUrl, request.method, headers, body);
          result = {
            status: retryResult.status,
            statusText: retryResult.statusText,
            headers: retryResult.headers,
            body: retryResult.body,
            size: new Blob([retryResult.body]).size,
            duration: Math.round(performance.now() - retryStart),
            timestamp: new Date().toISOString(),
          };
        } catch {
          // Fall through to return original 401 result
        }
      }
    }
  }

  // Run post-response scripts
  if (request.testScript) {
    runPostResponseScript(request.testScript, {
      responseBody: result.body,
      responseStatus: result.status,
      setGlobalVariable: envStore.setGlobalVariable,
      getGlobalVariable: (key) => envStore.globalVariables[key],
    });
  }

  // Log audit (fire-and-forget)
  if (!options.skipAudit) {
    const username = useAuthStore.getState().getUsername();
    logAudit({
      method: request.method,
      url: resolvedUrl,
      status: result.status,
      requestBody: body ?? null,
      responseBody: result.body,
      requestHeaders: JSON.stringify(headers),
      responseHeaders: JSON.stringify(result.headers),
      mode: options.mode,
      duration: result.duration,
      user: username,
    }).catch(() => {});
  }

  return result;
}

/**
 * Simple request executor for User Mode (no scripts, auto-auth).
 * Also routes through proxy to avoid CORS.
 */
export async function executeSimpleRequest(
  method: HttpMethod,
  url: string,
  body?: unknown,
  mode: AppMode = 'user'
): Promise<ApiResponse> {
  const token = await ensureValidToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const bodyStr = body ? JSON.stringify(body) : undefined;
  const start = performance.now();

  let result: ApiResponse;
  try {
    const proxyResult = await proxyFetch(url, method, headers, bodyStr);
    const duration = Math.round(performance.now() - start);

    result = {
      status: proxyResult.status,
      statusText: proxyResult.statusText,
      headers: proxyResult.headers,
      body: proxyResult.body,
      size: new Blob([proxyResult.body]).size,
      duration,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      status: 0,
      statusText: err instanceof Error ? err.message : 'Network Error',
      headers: {},
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Network Error' }),
      size: 0,
      duration: Math.round(performance.now() - start),
      timestamp: new Date().toISOString(),
    };
  }

  // Handle 401 with auto-retry
  if (result.status === 401 && token) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = useAuthStore.getState().getAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryStart = performance.now();
        try {
          const retryResult = await proxyFetch(url, method, headers, bodyStr);
          result = {
            status: retryResult.status,
            statusText: retryResult.statusText,
            headers: retryResult.headers,
            body: retryResult.body,
            size: new Blob([retryResult.body]).size,
            duration: Math.round(performance.now() - retryStart),
            timestamp: new Date().toISOString(),
          };
        } catch { /* fall through */ }
      }
    }
  }

  const username = useAuthStore.getState().getUsername();
  logAudit({
    method, url, status: result.status,
    requestBody: bodyStr ?? null,
    responseBody: result.body,
    requestHeaders: JSON.stringify(headers),
    responseHeaders: JSON.stringify(result.headers),
    mode, duration: result.duration,
    user: username,
  }).catch(() => {});

  return result;
}

// ─── Audit Helper ─────────────────────────────────────────────

async function logAudit(entry: {
  method: string;
  url: string;
  status: number;
  requestBody: string | null;
  responseBody: string | null;
  requestHeaders: string | null;
  responseHeaders: string | null;
  mode: string;
  duration: number;
  user: string;
}) {
  try {
    await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        ...entry,
      }),
    });
  } catch {
    // Audit logging is best-effort
  }
}
