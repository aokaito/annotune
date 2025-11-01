// API クライアントと認証情報をまとめて提供するフック。
import { useEffect, useMemo } from 'react';
import { createHttpApi, mockApi } from '../api/client';
import { useAuthStore } from '../store/auth';
import type { AuthState } from '../store/auth';

export const useAnnotuneApi = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const userId = useAuthStore((state: AuthState) => state.userId);
  const isAuthenticated = useAuthStore((state: AuthState) => state.isAuthenticated);
  const expiresAt = useAuthStore((state: AuthState) => state.expiresAt);
  const signOut = useAuthStore((state: AuthState) => state.signOut);

  const mode = baseUrl ? 'http' : 'mock';

  useEffect(() => {
    if (!expiresAt) return;
    if (Date.now() >= expiresAt) {
      signOut();
    }
  }, [expiresAt, signOut]);

  const api = useMemo(() => {
    if (!baseUrl) {
      return mockApi;
    }
    const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return createHttpApi({
      baseUrl: normalized,
      getIdToken: () => useAuthStore.getState().idToken
    });
  }, [baseUrl]);

  return {
    api,
    mode,
    userId: mode === 'mock' ? 'demo-user' : userId,
    isAuthenticated: mode === 'mock' ? true : isAuthenticated
  };
};
