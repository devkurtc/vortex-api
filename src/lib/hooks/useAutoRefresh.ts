'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { refreshAccessToken } from '@/lib/engine/token-manager';
import { TOKEN_REFRESH_INTERVAL } from '@/lib/constants';

/**
 * Hook that runs a background timer to proactively refresh tokens
 * before they expire (60s TTL, refresh when <15s remaining).
 */
export function useAutoRefresh() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const store = useAuthStore.getState();
      if (store.tokenData && store.isTokenExpiring() && !store.isRefreshing) {
        refreshAccessToken().catch(() => {});
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
