# CLAUDE.md

## Project Overview

Annotune — ボーカル練習用アノテーションツール。歌詞に対してボーカルテクニック（ビブラート、しゃくり、フォール、ブレス）、声質タグ（ウィスパー、エッジ、ファルセット）、コメントを付与できる。TypeScriptモノレポ構成。

## Monorepo Structure

```
frontend/          # React 18 SPA (Vite, TailwindCSS, Zustand, TanStack Query)
backend/           # Node.js 20 Lambda (DynamoDB, Zod, Pino)
infra/             # AWS CDK (Cognito, DynamoDB, Lambda, API Gateway, S3+CloudFront)
packages/common/   # 共有型・ユーティリティ
```

## Commands

### ルート
| コマンド | 説明 |
|----------|------|
| `npm run lint` | frontend + backend のlint |
| `npm run typecheck` | 全ワークスペースの型チェック |
| `npm run build:frontend` | React SPAビルド |
| `npm run build:backend` | Lambdaハンドラビルド |
| `npm run synth` | CDKテンプレート生成 |

### Frontend (`npm --prefix frontend run ...`)
`dev` / `build` / `test` / `test:e2e` / `lint` / `typecheck`

### Backend (`npm --prefix backend run ...`)
`build` / `test` / `lint` / `typecheck`

### Infra (`npm --prefix infra run ...`)
`synth` / `deploy` / `diff`

---

## Slash Commands

プロジェクト固有のスラッシュコマンド（`.claude/commands/`）:

| コマンド | 説明 |
|----------|------|
| `/check` | コミット前品質チェック（lint→typecheck→test を順次実行、失敗時は自動修正） |
| `/deploy` | AWS CDKデプロイ（build→synth→diff→確認→deploy） |
| `/pr` | 日本語PRを作成（変更分析→/check実行→gh pr create） |
| `/new-api-endpoint` | バックエンドAPIスキャフォールド（Schema→Repository→Service→Handler→Router登録） |
| `/agent-team` | 6エージェントチームでの開発ワークフロー実行 |

---

## Agent Team

`/agent-team` で起動する6エージェント（`.claude/agent-team.md` で定義）:

| エージェント | 役割 |
|--------------|------|
| **planner** | 要求分析・実装計画策定 |
| **devils_advocate** | 批判的検証・リスク指摘（計画時＆最終チェック） |
| **frontend_dev** | フロントエンド実装 |
| **backend_dev** | バックエンド実装 |
| **code_reviewer** | コードレビュー（正確性・セキュリティ・パフォーマンス・設計） |
| **qa_engineer** | テスト計画・E2Eシナリオ作成 |

標準フロー: planner → devils_advocate(計画批評) → frontend/backend_dev → code_reviewer → qa_engineer → devils_advocate(最終評価)

---

## Hooks

`.claude/settings.json` で設定済み:

- **SessionStart**: リモート環境（Claude.ai Web）でのセッション開始時に `npm install` を自動実行
- **Notification**: 全通知を有効化

---

## Code Conventions

- **Language**: TypeScript strict。ドキュメント・UIは日本語
- **Backend**: Router → Handler → Repository → DynamoDB（Serviceはシングルトンファクトリ）
- **Validation**: Zod (`backend/src/schemas/`)
- **Error**: `HttpError` / `NotFoundError` (`backend/src/utils/errors.ts`)
- **Auth**: `getAuthenticatedUser(event)` (`backend/src/utils/auth.ts`)
- **Frontend State**: Zustand (auth), TanStack Query (server state)
- **API Client**: `VITE_API_BASE_URL` 未設定時はモック、設定時はHTTPクライアント
- **Components**: Radix UI + TailwindCSS
- **Routing**: React Router v6 (lazy-loaded)
- **Shared Types**: `packages/common/src/types.ts`
- **ID**: nanoid
- **Optimistic Locking**: `X-Doc-Version` ヘッダー
- **Testing**: Vitest + Playwright E2E (1280x800 / 768x1024 / 375x812)

---

## MCP Servers

`.mcp.json` で設定済み:

| サーバ | 用途 | 使用例 |
|--------|------|--------|
| **context7** | 最新ドキュメント参照 | `TanStack Queryの使い方を context7 で調べて` |
| **github** | Issue・PR操作 | `issue #42 を確認して実装して` |
| **playwright** | ブラウザ操作・E2Eデバッグ | `localhost:5173 でE2Eテストを書いて` |

### GitHub MCP セットアップ

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxx"  # ~/.zshrc に追加
```
必要スコープ: `repo`, `read:org`

---

## CI/CD

GitHub Actions (`.github/workflows/`):
- **frontend.yml**: lint → typecheck → test → build
- **backend.yml**: lint → typecheck → test → build
- **auto-fix.yml**: 自動修正

---

## Architecture

- **DynamoDB**: Lyrics, Annotations, Versions（全テーブル `ownerId` GSI、PITR有効）
- **Auth**: Cognito UserPool + Hosted UI + OAuth
- **Hosting**: S3 + CloudFront
- **Lambda**: Node.js 20, 512MB, 30s timeout
