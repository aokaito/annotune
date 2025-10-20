// アプリ全体のルーティングと共通レイアウトを定義するファイル。
import { Route, Routes } from 'react-router-dom';
import { Suspense } from 'react';
import { DashboardPage } from './routes/DashboardPage';
import { EditorPage } from './routes/EditorPage';
import { AuthCallbackPage } from './routes/AuthCallbackPage';
import { PublicViewPage } from './routes/PublicViewPage';
import { Header } from './components/layout/Header';
import { VersionsPage } from './routes/VersionsPage';
import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* 画面上部に常に表示するヘッダー */}
      <Header />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        {/* 遅延ロード時のフォールバック表示を設定 */}
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          {/* 各 URL パスと画面コンポーネントの対応付け */}
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/editor/:docId" element={<EditorPage />} />
            <Route path="/public/:docId" element={<PublicViewPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/versions/:docId" element={<VersionsPage />} />
          </Routes>
        </Suspense>
      </main>
      {/* 通知トーストの描画位置 */}
      <Toaster position="top-right" />
    </div>
  );
};

export default App;
