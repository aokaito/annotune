import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  useEffect(() => {
    const params = new URLSearchParams(location.hash.replace(/^#/, ''));
    const idToken = params.get('id_token');
    const displayName = params.get('name') ?? 'Vocalist';
    if (idToken) {
      setAuthenticated('stub-user', displayName);
    }
    navigate('/', { replace: true });
  }, [location.hash, navigate, setAuthenticated]);

  return <p className="text-muted-foreground">Signing you in…</p>;
};
