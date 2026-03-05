'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TokenData, DecodedJwt } from '@/lib/types';

function decodeJwt(token: string): DecodedJwt | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

interface AuthState {
  tokenData: TokenData | null;
  isRefreshing: boolean;
  refreshPromise: Promise<boolean> | null;

  // Computed
  isAuthenticated: () => boolean;
  getAccessToken: () => string | null;
  getUsername: () => string;
  getTokenExpiry: () => number; // seconds remaining
  isTokenExpiring: () => boolean; // <15s remaining

  // Actions
  setTokenData: (data: TokenData) => void;
  clearTokens: () => void;
  setRefreshing: (refreshing: boolean) => void;
  setRefreshPromise: (promise: Promise<boolean> | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tokenData: null,
      isRefreshing: false,
      refreshPromise: null,

      isAuthenticated: () => {
        const { tokenData } = get();
        if (!tokenData) return false;
        const expiry = get().getTokenExpiry();
        return expiry > 0;
      },

      getAccessToken: () => {
        const { tokenData } = get();
        return tokenData?.access_token ?? null;
      },

      getUsername: () => {
        const { tokenData } = get();
        if (!tokenData) return 'anonymous';
        const decoded = decodeJwt(tokenData.access_token);
        return decoded?.preferred_username ?? 'unknown';
      },

      getTokenExpiry: () => {
        const { tokenData } = get();
        if (!tokenData) return 0;
        const expiresAt = tokenData.obtained_at + tokenData.expires_in * 1000;
        return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      },

      isTokenExpiring: () => {
        return get().getTokenExpiry() < 15;
      },

      setTokenData: (data) => set({ tokenData: data }),
      clearTokens: () => set({ tokenData: null, isRefreshing: false, refreshPromise: null }),
      setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
      setRefreshPromise: (promise) => set({ refreshPromise: promise }),
    }),
    {
      name: 'vortex-auth',
      partialize: (state) => ({ tokenData: state.tokenData }),
    }
  )
);
