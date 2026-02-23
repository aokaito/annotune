// このファイルはアプリのエントリーポイントで、依存プロバイダーをまとめて初期化する。
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// ここで React Query に渡すクライアントを 1 つだけ生成し使い回す
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* React Query で API キャッシュを扱う。全コンポーネントから参照するため最上位に配置 */}
    <QueryClientProvider client={queryClient}>
      {/* SPA のルーティングを有効化し、URL に応じてページを切り替える */}
      <BrowserRouter>
        {/* 画面全体の構成をまとめた App コンポーネントを描画 */}
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
