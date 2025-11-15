// NOTE: 共通ヘッダー。アカウント操作は Material Symbols のアイコンボタンからメニューを表示する。
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '../ui/sheet';
import { useAnnotuneApi } from '../../hooks/useAnnotuneApi';
import { useAuthStore } from '../../store/auth';
import type { AuthState } from '../../store/auth';

const navItems: ReadonlyArray<{ key: string; label: string; to: string; end?: boolean }> = [
  { key: 'dashboard', label: 'ダッシュボード', to: '/', end: true }
];

export const Header = () => {
  const { mode, isAuthenticated } = useAnnotuneApi();
  const displayName = useAuthStore((state: AuthState) => state.displayName);
  const setDisplayName = useAuthStore((state: AuthState) => state.setDisplayName);
  const signOut = useAuthStore((state: AuthState) => state.signOut);
  const [open, setOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountNameInput, setAccountNameInput] = useState(displayName);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const loginHref = import.meta.env.VITE_COGNITO_LOGIN_URL?.trim() || '#';
  const logoutHref = import.meta.env.VITE_COGNITO_LOGOUT_URL?.trim();

  const effectiveDisplayName =
    displayName || (mode === 'mock' ? 'Demo Vocalist' : 'サインインしてください');

  useEffect(() => {
    setAccountNameInput(displayName);
  }, [displayName]);

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

  const handleSaveAccountName = () => {
    const trimmed = accountNameInput.trim();
    if (trimmed) {
      setDisplayName(trimmed);
    }
    setAccountMenuOpen(false);
  };

  const handleSignOut = () => {
    setAccountMenuOpen(false);
    signOut();
    if (logoutHref && typeof window !== 'undefined') {
      window.location.href = logoutHref;
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center rounded-md px-4 text-sm font-medium transition ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  const accountButton = (
    <button
      type="button"
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-muted"
      onClick={() => {
        setAccountNameInput(effectiveDisplayName);
        setAccountMenuOpen((prev) => !prev);
      }}
      aria-label="アカウント設定"
    >
      <span className="material-symbols-rounded text-2xl">account_circle</span>
    </button>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="text-lg font-semibold text-foreground md:text-xl">
          Annotune
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.key} to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
          {mode === 'mock' && (
            <span className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-muted-foreground">
              デモモード
            </span>
          )}
          {mode === 'http' && !isAuthenticated && (
            <a
              className="inline-flex min-h-11 items-center rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90"
              href={loginHref}
            >
              サインイン
            </a>
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
            <div className="mt-6 flex flex-col gap-3">
              {navItems.map((item) => (
                <SheetClose asChild key={item.key}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }: { isActive: boolean }) =>
                      `inline-flex w-full items-center rounded-md px-4 py-3 text-base font-medium transition ${
                        isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </SheetClose>
              ))}
              {mode === 'mock' && (
                <span className="inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-3 text-base font-semibold text-muted-foreground">
                  デモモード
                </span>
              )}
              {mode === 'http' && !isAuthenticated && (
                <SheetClose asChild>
                  <a
                    className="inline-flex w-full items-center justify-center rounded-md bg-secondary px-4 py-3 text-base font-semibold text-secondary-foreground transition hover:bg-secondary/90"
                    href={loginHref}
                  >
                    サインイン
                  </a>
                </SheetClose>
              )}
              {mode === 'http' && isAuthenticated && (
                <>
                  <SheetClose asChild>
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-3 text-base font-semibold text-muted-foreground transition hover:bg-muted"
                      onClick={() => {
                        setAccountNameInput(effectiveDisplayName);
                        setAccountMenuOpen(true);
                      }}
                    >
                      アカウント
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
      {accountMenuOpen && mode === 'http' && isAuthenticated && (
        <div className="absolute inset-x-0 top-full flex justify-end px-4 sm:px-6">
          <div
            ref={menuRef}
            className="mt-2 w-full max-w-xs rounded-2xl border border-border bg-card p-4 shadow-lg md:max-w-sm"
          >
            <p className="text-sm font-medium text-foreground">アカウント名</p>
            <input
              type="text"
              className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              value={accountNameInput}
              onChange={(event) => setAccountNameInput(event.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2 text-sm">
              <button
                type="button"
                className="rounded-md border border-border px-4 py-2 text-muted-foreground transition hover:text-foreground"
                onClick={() => setAccountMenuOpen(false)}
              >
                閉じる
              </button>
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:bg-primary/90"
                onClick={handleSaveAccountName}
              >
                保存
              </button>
              <button
                type="button"
                className="rounded-md border border-red-200 px-4 py-2 font-semibold text-red-600 transition hover:bg-red-50"
                onClick={handleSignOut}
              >
                サインアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
