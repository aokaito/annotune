// NOTE: 共通レイアウトへ移行しレスポンシブ余白を集約。代替案: ルートごとに container クラスを付けるが重複を避けるためここで統一
import { Route, Routes } from 'react-router-dom';
import { Suspense } from 'react';
import { DashboardPage } from './routes/DashboardPage';
import { EditorPage } from './routes/EditorPage';
import { AuthCallbackPage } from './routes/AuthCallbackPage';
import { PublicViewPage } from './routes/PublicViewPage';
import { VersionsPage } from './routes/VersionsPage';
import { AppLayout } from './components/layout/AppLayout';

const App = () => (
  <AppLayout>
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 md:pt-10">
      <Suspense fallback={<p className="text-muted-foreground">読み込み中です…</p>}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/editor/:docId" element={<EditorPage />} />
          <Route path="/public/:docId" element={<PublicViewPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/versions/:docId" element={<VersionsPage />} />
        </Routes>
      </Suspense>
    </div>
  </AppLayout>
);

export default App;
