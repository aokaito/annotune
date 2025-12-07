// API クライアントと認証情報をまとめて提供するフック。
import { useEffect, useMemo } from 'react';
import { createHttpApi, mockApi } from '../api/client';
import { useAuthStore } from '../store/auth';
import type { AuthState } from '../store/auth';

const normalizeBaseUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.host}/`;
  } catch {
    return value.endsWith('/') ? value.slice(0, -1) : value;
  }
};

export const useAnnotuneApi = () => {
  const rawBase = import.meta.env.VITE_API_BASE_URL?.trim();
  const normalizedBase = rawBase ? normalizeBaseUrl(rawBase) : undefined;
  const userId = useAuthStore((state: AuthState) => state.userId);
  const isAuthenticated = useAuthStore((state: AuthState) => state.isAuthenticated);
  const expiresAt = useAuthStore((state: AuthState) => state.expiresAt);
  const signOut = useAuthStore((state: AuthState) => state.signOut);

  const mode = normalizedBase ? 'http' : 'mock';

  useEffect(() => {
    if (!expiresAt) return;
    if (Date.now() >= expiresAt) {
      signOut();
    }
  }, [expiresAt, signOut]);

  const api = useMemo(() => {
    if (!normalizedBase) {
      return mockApi;
    }
    const normalized = normalizedBase.endsWith('/')
      ? normalizedBase.slice(0, -1)
      : normalizedBase;
    return createHttpApi({
      baseUrl: normalized,
      getIdToken: () => useAuthStore.getState().idToken
    });
  }, [normalizedBase]);

  return {
    api,
    mode,
    userId: mode === 'mock' ? 'demo-user' : userId,
    isAuthenticated: mode === 'mock' ? true : isAuthenticated
  };
};
