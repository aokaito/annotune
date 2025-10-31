// NOTE: 共通レイアウトを集約しレスポンシブ余白を揃えるための殻。代替案: react-router の layout route を導入しても良いが既存構造を保つためコンポーネント化
import { PropsWithChildren } from 'react';
import { Header } from './Header';
import { Toaster } from 'react-hot-toast';

export const AppLayout = ({ children }: PropsWithChildren) => (
  <div className="min-h-dvh flex flex-col bg-background text-foreground">
    <a
      href="#main-content"
      className="fixed left-2 top-2 z-50 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground opacity-0 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      メインコンテンツへ移動
    </a>
    <Header />
    <main id="main-content" className="flex-1">
      {children}
    </main>
    <footer className="border-t border-border bg-card/80 py-4 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} Annotune
    </footer>
    <Toaster position="top-right" />
  </div>
);
