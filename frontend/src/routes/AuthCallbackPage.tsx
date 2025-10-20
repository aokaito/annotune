// Cognito Hosted UI からのリダイレクトを処理し、ユーザー情報を Zustand に保存する。
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  useEffect(() => {
    // ハッシュフラグメントから ID トークンや表示名を抽出
    const params = new URLSearchParams(location.hash.replace(/^#/, ''));
    const idToken = params.get('id_token');
    const displayName = params.get('name') ?? 'Vocalist';
    if (idToken) {
      // 本番ではトークン検証後のユーザー情報を保存する想定
      setAuthenticated('stub-user', displayName);
    }
    navigate('/', { replace: true });
  }, [location.hash, navigate, setAuthenticated]);

  return <p className="text-muted-foreground">Signing you in…</p>;
};
