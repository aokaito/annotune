// NOTE: 幅ごとのレスポンシブ検証を自動化。代替案: Vitest + jsdom でレイアウト検証も可能だがブラウザ挙動を優先
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev -- --host --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 800 } }
    },
    {
      name: 'tablet',
      use: { viewport: { width: 768, height: 1024 } }
    },
    {
      name: 'mobile',
      use: { viewport: { width: 375, height: 812 } }
    }
  ]
});
