// このコンポーネントは Cognito Hosted UI からのリダイレクトを処理し、ユーザー情報を Zustand に保存する。
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStoredDisplayName, useAuthStore } from '../store/auth';
import type { AuthState } from '../store/auth';

type IdTokenPayload = {
  sub?: string;
  name?: string;
  email?: string;
  'cognito:username'?: string;
};

const decodeJwt = <T,>(token: string): T | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    const decoded = atob(normalized + padding);
    return JSON.parse(decoded) as T;
  } catch (error) {
    console.error('Failed to decode JWT payload', error);
    return null;
  }
};

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuthenticated = useAuthStore((state: AuthState) => state.setAuthenticated);

  useEffect(() => {
    // ハッシュフラグメントから ID トークンや表示名を抽出
    const params = new URLSearchParams(location.hash.replace(/^#/, ''));
    const idToken = params.get('id_token');

    if (idToken) {
      const payload = decodeJwt<IdTokenPayload>(idToken);
      const accessToken = params.get('access_token');
      const expiresIn = params.get('expires_in');
      const userId =
        payload?.sub ?? payload?.['cognito:username'] ?? payload?.email ?? 'current-user';
      const storedDisplayName = getStoredDisplayName(userId);
      const displayName =
        storedDisplayName ?? params.get('name') ?? payload?.name ?? payload?.email ?? 'Vocalist';
      const expiresAt = expiresIn ? Date.now() + Number(expiresIn) * 1000 : null;

      setAuthenticated({
        userId,
        displayName,
        idToken,
        accessToken,
        expiresAt
      });
    }
    // コールバック完了後はトップページへ戻す
    navigate('/', { replace: true });
  }, [location.hash, navigate, setAuthenticated]);

  // ホストされた UI から戻った直後に一瞬だけ表示されるメッセージ
  return <p className="text-muted-foreground">サインイン処理中です…</p>;
};
