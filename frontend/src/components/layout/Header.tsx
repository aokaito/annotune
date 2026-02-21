import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '../ui/sheet';
import { useAnnotuneApi } from '../../hooks/useAnnotuneApi';
import { useAuthStore } from '../../store/auth';
import type { AuthState } from '../../store/auth';

export const Header = () => {
  const { mode, isAuthenticated } = useAnnotuneApi();
  const displayName = useAuthStore((state: AuthState) => state.displayName);
  const signOut = useAuthStore((state: AuthState) => state.signOut);
  const [open, setOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  // カスタムログインページを使用
  const loginHref = '/login';
  const logoutHref = import.meta.env.VITE_COGNITO_LOGOUT_URL?.trim();
  const navigate = useNavigate();

  const effectiveDisplayName =
    displayName || (mode === 'mock' ? 'Demo Vocalist' : 'サインインしてください');

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current || menuRef.current.contains(event.target as Node)) {
        return;
      }
      setAccountMenuOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [accountMenuOpen]);

  const handleSignOut = () => {
    setAccountMenuOpen(false);
    signOut();
    if (logoutHref && typeof window !== 'undefined') {
      window.location.href = logoutHref;
    }
  };

  const accountButton = (
    <button
      type="button"
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-muted"
      onClick={() => setAccountMenuOpen((prev) => !prev)}
      aria-label="アカウントメニューを開く"
    >
      <span className="material-symbols-rounded text-2xl">account_circle</span>
    </button>
  );

  return (
    <header className="relative sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <img
            src="/annotune-icon.png"
            alt="Annotune icon"
            className="h-7 shadow-sm"
          />
          <Link to="/" className="text-lg font-semibold text-foreground md:text-xl">
            Annotune
          </Link>
        </div>
        <nav className="hidden items-center gap-2 md:flex">
          <Link
            to="/discover"
            className="inline-flex min-h-11 items-center rounded-md px-4 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            公開ライブラリ
          </Link>
          {mode === 'mock' && (
            <span className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-muted-foreground">
              デモモード
            </span>
          )}
          {mode === 'http' && !isAuthenticated && (
            <>
              <a
                className="inline-flex min-h-11 items-center rounded-md px-4 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                href={loginHref}
              >
                ログイン
              </a>
              <a
                className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                href={loginHref}
              >
                新規登録
              </a>
            </>
          )}
          {mode === 'http' && isAuthenticated && <div className="relative">{accountButton}</div>}
        </nav>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="メニューを開く"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-foreground transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </SheetTrigger>
          <SheetContent side="left" className="md:hidden">
            <SheetHeader>
              <SheetTitle>メニュー</SheetTitle>
            </SheetHeader>
            <div className="mt-3 flex flex-col gap-3">
              <SheetClose asChild>
                <Link
                  className="inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-3 text-base font-semibold text-foreground transition hover:bg-muted"
                  to="/discover"
                >
                  公開ライブラリを見る
                </Link>
              </SheetClose>
              {mode === 'mock' && (
                <span className="inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-3 text-base font-semibold text-muted-foreground">
                  デモモード
                </span>
              )}
              {mode === 'http' && !isAuthenticated && (
                <>
                  <SheetClose asChild>
                    <a
                      className="inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-3 text-base font-semibold text-foreground transition hover:bg-muted"
                      href={loginHref}
                    >
                      ログイン
                    </a>
                  </SheetClose>
                  <SheetClose asChild>
                    <a
                      className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition hover:bg-primary/90"
                      href={loginHref}
                    >
                      新規登録
                    </a>
                  </SheetClose>
                </>
              )}
              {mode === 'http' && isAuthenticated && (
                <>
                  <SheetClose asChild>
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-3 text-base font-semibold text-muted-foreground transition hover:bg-muted"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        navigate('/account');
                      }}
                    >
                      アカウント設定
                    </button>
                  </SheetClose>
                  <SheetClose asChild>
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-3 text-base font-semibold text-muted-foreground transition hover:bg-muted"
                      onClick={handleSignOut}
                    >
                      サインアウト
                    </button>
                  </SheetClose>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {mode === 'http' && isAuthenticated && accountMenuOpen && (
        <div className="absolute inset-x-0 top-full flex justify-end px-4 sm:px-6">
          <div
            ref={menuRef}
            className="mt-2 w-fit max-w-[90vw] space-y-2 rounded-2xl border border-border bg-card p-4 shadow-lg"
          >
            <p className="text-sm font-semibold text-foreground">{effectiveDisplayName}</p>
            <button
              type="button"
              className="w-full rounded-md border border-border px-4 py-2 text-left text-sm font-medium text-foreground transition hover:bg-muted"
              onClick={() => {
                setAccountMenuOpen(false);
                navigate('/account');
              }}
            >
              アカウント設定
            </button>
            <button
              type="button"
              className="w-full rounded-md border border-destructive/30 px-4 py-2 text-left text-sm font-medium text-destructive transition hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              サインアウト
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
