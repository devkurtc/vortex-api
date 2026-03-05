import { useAuthStore } from '@/lib/stores/auth-store';
import { KEYCLOAK_TOKEN_URL, KEYCLOAK_CLIENT_ID } from '@/lib/constants';
import type { TokenData } from '@/lib/types';

/**
 * Call Keycloak token endpoint via our server-side proxy to avoid CORS issues.
 */
async function keycloakTokenRequest(bodyParams: Record<string, string>): Promise<Response> {
  const proxyRes = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: KEYCLOAK_TOKEN_URL,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(bodyParams).toString(),
    }),
  });

  // The proxy returns { status, statusText, headers, body }
  const data = await proxyRes.json();

  // Wrap into a Response-like object for consistent handling
  return {
    ok: data.status >= 200 && data.status < 300,
    status: data.status,
    statusText: data.statusText || '',
    json: async () => JSON.parse(data.body || '{}'),
  } as Response;
}

/**
 * Authenticate with Keycloak using Resource Owner Password Grant.
 */
export async function authenticateWithKeycloak(
  username: string,
  password: string
): Promise<TokenData> {
  const res = await keycloakTokenRequest({
    grant_type: 'password',
    client_id: KEYCLOAK_CLIENT_ID,
    username,
    password,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error_description || `Authentication failed (${res.status})`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
    obtained_at: Date.now(),
  };
}

/**
 * Refresh the access token using the refresh token.
 */
export async function refreshAccessToken(): Promise<boolean> {
  const store = useAuthStore.getState();
  const { tokenData, isRefreshing, refreshPromise } = store;

  // If already refreshing, wait for the in-flight refresh
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  if (!tokenData?.refresh_token) {
    store.clearTokens();
    return false;
  }

  const promise = (async () => {
    store.setRefreshing(true);
    try {
      const res = await keycloakTokenRequest({
        grant_type: 'refresh_token',
        client_id: KEYCLOAK_CLIENT_ID,
        refresh_token: tokenData.refresh_token!,
      });

      if (!res.ok) {
        store.clearTokens();
        return false;
      }

      const data = await res.json();
      store.setTokenData({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        obtained_at: Date.now(),
      });

      return true;
    } catch {
      store.clearTokens();
      return false;
    } finally {
      store.setRefreshing(false);
      store.setRefreshPromise(null);
    }
  })();

  store.setRefreshPromise(promise);
  return promise;
}

/**
 * Ensure we have a valid token before making a request.
 * Returns the access token or null if authentication is needed.
 */
export async function ensureValidToken(): Promise<string | null> {
  const store = useAuthStore.getState();

  if (!store.tokenData) return null;

  // Token is still valid and not expiring soon
  if (!store.isTokenExpiring()) {
    return store.getAccessToken();
  }

  // Token is expiring — try to refresh
  const refreshed = await refreshAccessToken();
  if (refreshed) {
    return useAuthStore.getState().getAccessToken();
  }

  return null;
}
