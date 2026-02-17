// カスタムログインページ - 日本語UI
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';
import { useAuthStore } from '../store/auth';
import { getStoredDisplayName } from '../store/auth';

// Cognitoエラーの型定義
interface CognitoError extends Error {
  code?: string;
}

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

const userPool = userPoolId && clientId
  ? new CognitoUserPool({
      UserPoolId: userPoolId,
      ClientId: clientId
    })
  : null;

type AuthMode = 'signIn' | 'signUp' | 'confirmSignUp' | 'forgotPassword' | 'confirmPassword';

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!userPool) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
          <p className="text-center text-destructive">
            認証設定が見つかりません。環境変数を確認してください。
          </p>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        const accessToken = result.getAccessToken().getJwtToken();
        const payload = result.getIdToken().payload;
        const userId = payload.sub || payload['cognito:username'] || email;
        const storedDisplayName = getStoredDisplayName(userId);
        const displayName =
          storedDisplayName ||
          payload.name ||
          payload.preferred_username ||
          payload['cognito:username'] ||
          payload.email ||
          'Vocalist';
        const expiresAt = result.getIdToken().getExpiration() * 1000;

        setAuthenticated({
          userId,
          displayName,
          idToken,
          accessToken,
          expiresAt
        });

        setLoading(false);
        navigate('/', { replace: true });
      },
      onFailure: (err: CognitoError) => {
        setLoading(false);
        if (err.code === 'UserNotConfirmedException') {
          setMode('confirmSignUp');
          setMessage('メールアドレスの確認が必要です。確認コードを入力してください。');
        } else if (err.code === 'NotAuthorizedException') {
          setError('メールアドレスまたはパスワードが正しくありません。');
        } else if (err.code === 'UserNotFoundException') {
          setError('このメールアドレスは登録されていません。');
        } else {
          setError(err.message || 'サインインに失敗しました。');
        }
      },
      newPasswordRequired: () => {
        setLoading(false);
        setError('新しいパスワードの設定が必要です。管理者にお問い合わせください。');
      }
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください。');
      return;
    }

    setLoading(true);

    const attributeList = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: email
      })
    ];

    userPool.signUp(email, password, attributeList, [], (err, result) => {
      setLoading(false);
      if (err) {
        const cognitoErr = err as CognitoError;
        if (cognitoErr.code === 'UsernameExistsException') {
          setError('このメールアドレスは既に登録されています。');
        } else if (cognitoErr.code === 'InvalidPasswordException') {
          setError('パスワードは8文字以上で、大文字・小文字・数字を含めてください。');
        } else {
          setError(cognitoErr.message || 'アカウント作成に失敗しました。');
        }
        return;
      }
      if (result) {
        setMode('confirmSignUp');
        setMessage('確認コードをメールで送信しました。コードを入力してください。');
      }
    });
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool
    });

    cognitoUser.confirmRegistration(verificationCode, true, (err) => {
      setLoading(false);
      if (err) {
        const cognitoErr = err as CognitoError;
        if (cognitoErr.code === 'CodeMismatchException') {
          setError('確認コードが正しくありません。');
        } else if (cognitoErr.code === 'ExpiredCodeException') {
          setError('確認コードの有効期限が切れています。再送信してください。');
        } else {
          setError(cognitoErr.message || '確認に失敗しました。');
        }
        return;
      }
      setMessage('アカウントが確認されました。サインインしてください。');
      setMode('signIn');
      setVerificationCode('');
    });
  };

  const handleResendCode = () => {
    setError('');
    setLoading(true);

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool
    });

    cognitoUser.resendConfirmationCode((err) => {
      setLoading(false);
      if (err) {
        setError(err.message || '確認コードの再送信に失敗しました。');
        return;
      }
      setMessage('確認コードを再送信しました。');
    });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool
    });

    cognitoUser.forgotPassword({
      onSuccess: () => {
        setLoading(false);
        setMode('confirmPassword');
        setMessage('パスワードリセット用のコードをメールで送信しました。');
      },
      onFailure: (err: CognitoError) => {
        setLoading(false);
        if (err.code === 'UserNotFoundException') {
          setError('このメールアドレスは登録されていません。');
        } else if (err.code === 'LimitExceededException') {
          setError('リクエストが多すぎます。しばらく待ってから再試行してください。');
        } else {
          setError(err.message || 'パスワードリセットに失敗しました。');
        }
      }
    });
  };

  const handleConfirmPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください。');
      return;
    }

    setLoading(true);

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool
    });

    cognitoUser.confirmPassword(verificationCode, password, {
      onSuccess: () => {
        setLoading(false);
        setMessage('パスワードがリセットされました。新しいパスワードでサインインしてください。');
        setMode('signIn');
        setPassword('');
        setConfirmPassword('');
        setVerificationCode('');
      },
      onFailure: (err: CognitoError) => {
        setLoading(false);
        if (err.code === 'CodeMismatchException') {
          setError('確認コードが正しくありません。');
        } else if (err.code === 'ExpiredCodeException') {
          setError('確認コードの有効期限が切れています。');
        } else if (err.code === 'InvalidPasswordException') {
          setError('パスワードは8文字以上で、大文字・小文字・数字を含めてください。');
        } else {
          setError(err.message || 'パスワードリセットに失敗しました。');
        }
      }
    });
  };

  const getTitle = () => {
    switch (mode) {
      case 'signIn':
        return 'サインイン';
      case 'signUp':
        return 'アカウント作成';
      case 'confirmSignUp':
        return 'メールアドレスの確認';
      case 'forgotPassword':
        return 'パスワードをお忘れですか？';
      case 'confirmPassword':
        return '新しいパスワードを設定';
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-3">
        <img src="/annotune-icon.png" alt="Annotune" className="h-10" />
        <span className="text-2xl font-bold text-foreground">Annotune</span>
      </div>

      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-foreground">{getTitle()}</h1>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
            {message}
          </div>
        )}

        {mode === 'signIn' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'サインイン中...' : 'サインイン'}
            </button>
            <div className="mt-4 space-y-2 text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setMode('forgotPassword');
                  setError('');
                  setMessage('');
                }}
                className="text-primary hover:underline"
              >
                パスワードをお忘れですか？
              </button>
              <p className="text-muted-foreground">
                アカウントをお持ちでない方は{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signUp');
                    setError('');
                    setMessage('');
                  }}
                  className="text-primary hover:underline"
                >
                  新規登録
                </button>
              </p>
            </div>
          </form>
        )}

        {mode === 'signUp' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="8文字以上"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                8文字以上、大文字・小文字・数字を含めてください
              </p>
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? '登録中...' : 'アカウント作成'}
            </button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              既にアカウントをお持ちの方は{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signIn');
                  setError('');
                  setMessage('');
                }}
                className="text-primary hover:underline"
              >
                サインイン
              </button>
            </p>
          </form>
        )}

        {mode === 'confirmSignUp' && (
          <form onSubmit={handleConfirmSignUp} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>{email}</strong> に確認コードを送信しました。
            </p>
            <div>
              <label
                htmlFor="verificationCode"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                確認コード
              </label>
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="123456"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? '確認中...' : '確認'}
            </button>
            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="text-primary hover:underline disabled:opacity-50"
              >
                確認コードを再送信
              </button>
            </div>
          </form>
        )}

        {mode === 'forgotPassword' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              登録したメールアドレスを入力してください。パスワードリセット用のコードを送信します。
            </p>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="example@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? '送信中...' : 'リセットコードを送信'}
            </button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  setMode('signIn');
                  setError('');
                  setMessage('');
                }}
                className="text-primary hover:underline"
              >
                サインインに戻る
              </button>
            </p>
          </form>
        )}

        {mode === 'confirmPassword' && (
          <form onSubmit={handleConfirmPassword} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>{email}</strong> にリセットコードを送信しました。
            </p>
            <div>
              <label
                htmlFor="verificationCode"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                リセットコード
              </label>
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="123456"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
                新しいパスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="8文字以上"
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                新しいパスワード（確認）
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'リセット中...' : 'パスワードをリセット'}
            </button>
          </form>
        )}
      </div>

      <Link to="/" className="mt-6 text-sm text-muted-foreground hover:text-foreground">
        トップページに戻る
      </Link>
    </div>
  );
};
