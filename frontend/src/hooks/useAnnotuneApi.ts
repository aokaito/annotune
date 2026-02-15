// API クライアントと認証情報をまとめて提供するフック。
import { useEffect, useMemo } from 'react';
import { createHttpApi, mockApi } from '../api/client';
import { useAuthStore } from '../store/auth';
import type { AuthState } from '../store/auth';

const normalizeBaseUrl = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const candidates = [/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`, trimmed];

  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      // パス部分（/prod など）を保持する
      const pathname = parsed.pathname.endsWith('/') ? parsed.pathname : `${parsed.pathname}/`;
      return `${parsed.protocol}//${parsed.host}${pathname}`;
    } catch {
      // noop
    }
  }

  console.warn('VITE_API_BASE_URL が URL として解釈できません。モック API を利用します。', value);
  return undefined;
};

export const useAnnotuneApi = () => {
  const rawBase = import.meta.env.VITE_API_BASE_URL?.trim();
  const normalizedBase = rawBase ? normalizeBaseUrl(rawBase) : undefined;
  const userId = useAuthStore((state: AuthState) => state.userId);
  const isAuthenticated = useAuthStore((state: AuthState) => state.isAuthenticated);
  const expiresAt = useAuthStore((state: AuthState) => state.expiresAt);
  const signOut = useAuthStore((state: AuthState) => state.signOut);
  const idToken = useAuthStore((state: AuthState) => state.idToken);

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
      // API Gateway JWT authorizer は idToken を期待する（openid, email, profile スコープが必要）
      getIdToken: () => useAuthStore.getState().idToken,
      getExpiresAt: () => useAuthStore.getState().expiresAt
    });
  }, [idToken, normalizedBase]);

  return {
    api,
    mode,
    userId: mode === 'mock' ? 'demo-user' : userId,
    isAuthenticated: mode === 'mock' ? true : isAuthenticated
  };
};
