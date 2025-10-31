// NOTE: 共通ヘッダーをモバイル対応するため Sheet ナビを追加。代替案: Headless UI の Dialog を使う実装もあるが既存依存に合わせ shadcn 構成
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '../ui/sheet';

const navItems: ReadonlyArray<{ key: string; label: string; to: string; end?: boolean }> = [
  { key: 'dashboard', label: 'ダッシュボード', to: '/', end: true },
  { key: 'versions', label: '履歴', to: '/versions/demo' }
];

const authLink = {
  key: 'signin',
  label: 'サインイン',
  href: import.meta.env.VITE_COGNITO_LOGIN_URL || '#'
};

export const Header = () => {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center rounded-md px-4 text-sm font-medium transition ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

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
          <a
            className="inline-flex min-h-11 items-center rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90"
            href={authLink.href}
          >
            {authLink.label}
          </a>
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
                    className={({ isActive }) =>
                      `inline-flex w-full items-center rounded-md px-4 py-3 text-base font-medium transition ${
                        isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <a
                  className="inline-flex w-full items-center rounded-md bg-secondary px-4 py-3 text-base font-semibold text-secondary-foreground transition hover:bg-secondary/90"
                  href={authLink.href}
                >
                  {authLink.label}
                </a>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
