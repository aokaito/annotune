# Annotune

Annotune は、歌詞テキストの特定範囲に歌唱テクニック（ビブラート／しゃくり等）やコメントを付与し、履歴管理や共有を可能にするボーカル練習ノートです。本リポジトリは以下の 3 パッケージで構成されています。

- `frontend/`：歌詞の閲覧・編集を行う React + Vite 製 SPA（Tailwind ベースの UI）
- `backend/`：MVP 要件を満たす REST API を提供する TypeScript Lambda ハンドラ群
- `infra/`：Cognito・API Gateway・Lambda・DynamoDB・S3/CloudFront を構築する AWS CDK（TypeScript）

## リポジトリ構成

```
.
├── frontend/          # React SPA（TanStack Query, Zustand, react-hook-form, Tailwind）
├── backend/           # Lambda ハンドラ、zod スキーマ、DynamoDB リポジトリ
├── infra/             # AWS サーバレス構成を展開する CDK スタック
└── .github/workflows/ # フロント／バックエンド向け CI ワークフロー
```

## フロントエンド概要

- ルーティング：React Router 6 によるダッシュボード／エディタ／バージョン／公開ビュー
- 状態管理：TanStack Query で API キャッシュ、Zustand で Cognito ユーザー情報を保持
- UI：範囲選択→注釈追加パレット、タグ色分けレンダリング、トースト通知によるフィードバック
- モック API：`src/api/client.ts` にインメモリ実装を用意しているため、バックエンド未構築でも動作確認可能

### ローカル開発

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

実際の Cognito Hosted UI が利用可能になったら、`frontend/.env.local` に以下を追加してください。

```
VITE_COGNITO_LOGIN_URL=https://your-domain.auth.ap-northeast-1.amazoncognito.com/login?... 
```

## バックエンド概要

- ハンドラ：`src/handlers/router.ts` が API Gateway のルートから各処理にディスパッチ
- バリデーション：`src/schemas/lyrics.ts` で zod による入力検証を実施
- データアクセス：`LyricsRepository` が DynamoDB の CRUD、楽観ロック、範囲重複チェック、スナップショット保存を一元管理
- テスト：Vitest によるスキーマ検証テストを `src/__tests__/schemas.test.ts` に配置

### ローカル確認

```bash
npm install --prefix backend
npm test --prefix backend
npm run build --prefix backend
```

ローカル実行・Lambda で必要な環境変数：

- `LYRICS_TABLE_NAME`
- `LYRICS_OWNER_INDEX_NAME`
- `ANNOTATIONS_TABLE_NAME`
- `VERSIONS_TABLE_NAME`
- `ALLOWED_ORIGIN`

## インフラ概要

CDK スタックで以下を展開します。

- **Amazon Cognito**：ユーザープール + Hosted UI 用クライアント
- **Amazon DynamoDB**：`AnnotuneLyrics` / `AnnotuneAnnotations` / `AnnotuneDocVersions` テーブル（オーナー GSI、PITR 有効）
- **AWS Lambda (Node.js 20)**：バックエンドハンドラを束ねた単一関数
- **Amazon API Gateway (HTTP API)**：JWT オーソライザー、CORS、公開用ルートを設定
- **Amazon S3 + CloudFront**：SPA 配信用バケットとディストリビューション（事前ビルド済み `frontend/dist` を想定）

### デプロイ手順

```bash
npm install --prefix infra
npm run build --prefix infra
npm run synth --prefix infra
npm run deploy --prefix infra
```

デプロイ前にフロントエンドをビルドしておくと、バケットへアセットを配置できます。

```bash
npm run build --prefix frontend
```

CI/CD 用には以下のシークレットを GitHub に登録してください。

- `AWS_DEPLOY_ROLE`：GitHub Actions が Assume する IAM ロール ARN
- `WEB_BUCKET`, `CLOUDFRONT_DISTRIBUTION`：フロントエンドデプロイ先 S3 バケットと CloudFront ID

## API リファレンス (v1)

- `POST /v1/lyrics`：歌詞ドキュメント作成
- `GET /v1/lyrics?mine=true`：自分のドキュメント一覧
- `GET /v1/lyrics/{docId}`：歌詞＋アノテーション取得（本人のみ）
- `PUT /v1/lyrics/{docId}`：歌詞更新（`X-Doc-Version` による楽観ロック必須）
- `DELETE /v1/lyrics/{docId}`：歌詞削除（本人のみ）
- `POST /v1/lyrics/{docId}/share`：公開可否を切り替え
- `POST /v1/lyrics/{docId}/annotations`：アノテーション追加（重複範囲は 400）
- `PUT /v1/lyrics/{docId}/annotations/{annotationId}`：アノテーション編集
- `DELETE /v1/lyrics/{docId}/annotations/{annotationId}`：アノテーション削除
- `GET /v1/lyrics/{docId}/versions`：バージョン一覧
- `GET /v1/lyrics/{docId}/versions/{version}`：特定バージョンのスナップショット取得
- `GET /v1/public/lyrics/{docId}`：公開ビュー（`isPublicView` が true の場合のみ）

エラーコードは HTTP の慣習に従います（400 範囲エラー、403 権限、404 未検出、409 バージョン不一致等）。

## 今後の推奨ステップ

1. フロントエンドの API 呼び出しを実デプロイした API Gateway URL＋Cognito JWT に切り替える。
2. モック API を Fetch ベースの実装へ差し替え、`X-Doc-Version` ヘッダーを付与。
3. インフラ面で WAF / レート制御 / ログ保持等を強化し、メトリクスにアラームを設定。
4. DynamoDB Local を用いた統合テストや React Testing Library による UI テストを拡充。

メロディへの注釈付けをお楽しみください！ 🎶
