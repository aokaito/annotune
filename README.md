# Annotune

Annotune は、歌詞の特定のフレーズにビブラート／しゃくりといった歌唱テクニックやコメント、属性情報（強さ・長さ）を付与し、履歴管理や共有もできるボーカル練習ノートです。このモノレポは、SPA で構築したエディタ／ビューア、Lambda ベースの API、Cognito/API Gateway/DynamoDB/S3+CloudFront を構築するインフラを含んでいます。

## リポジトリ構成

```
.
├── frontend/          # React + Vite SPA（Tailwind CSS、TanStack Query、Zustand、react-hook-form）
├── backend/           # Node.js Lambda ハンドラ、zod スキーマ、DynamoDB リポジトリ層
├── infra/             # AWS CDK スタック（Cognito/API Gateway/Lambda/Dynamo）
└── .github/workflows/ # フロント／バック用 CI ワークフロー
```

## フロントエンドの特徴

- **歌詞エディタ／ビューア**：範囲選択でタグとコメントをセットし、モバイル用アクションシートから注釈を追加できます。
- **インラインコメント**：歌詞フレーズの直下にコメントを表示するようにし、ビブラートなどの注釈と並列の UX を実現しました。
- **モック API**：`src/api/client.ts` にインメモリ実装があり、`VITE_API_BASE_URL` 未設定時はバックエンド不要で動作します。
- **注釈パレットと一覧**：タグチップ、強さ・長さ情報、モバイル向けアクションによって CRUD をサポートします。
- **認証対応**：Zustand で Cognito ユーザー情報を管理し、TanStack Query で歌詞/注釈のキャッシュとミューテーション状態を扱います。

### ローカル開発手順

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

本番の Cognito + API Gateway を利用する際は `frontend/.env.local` に以下を追記してください。

```
VITE_API_BASE_URL=https://your-api-id.execute-api.ap-northeast-1.amazonaws.com/
VITE_COGNITO_LOGIN_URL=https://your-domain.auth.ap-northeast-1.amazoncognito.com/login?...
# 任意：Hosted UI からのサインアウト後遷移先
VITE_COGNITO_LOGOUT_URL=https://your-domain.auth.ap-northeast-1.amazoncognito.com/logout?...
```

`VITE_API_BASE_URL` を設定すると、SPA はモックではなく API Gateway を呼び出します。`/prod` などステージ名は不要で、`<api-id>.execute-api.<region>.amazonaws.com/` の形式でアクセスしてください（CDK では `$default` ステージを使います）。

## バックエンド概要

- **ルーター**：`src/handlers/router.ts` が HTTP API の各ルートをハンドラへ振り分けます。
- **バリデーション**：`src/schemas/lyrics.ts` の zod スキーマで歌詞・注釈の入力を検証。
- **リポジトリ**：`LyricsRepository` が DynamoDB で CRUD、楽観ロック、重複チェック、バージョン保存を一元管理。
- **テスト**：Vitest で `src/__tests__/schemas.test.ts` などのスキーマ検証を実装。

### ローカル実行

```bash
npm install --prefix backend
npm test --prefix backend
npm run build --prefix backend
```

ローカルまたは Lambda 実行時に必要な環境変数：

- `LYRICS_TABLE_NAME`
- `LYRICS_OWNER_INDEX_NAME`
- `ANNOTATIONS_TABLE_NAME`
- `VERSIONS_TABLE_NAME`
- `ALLOWED_ORIGIN`

## インフラ概要

CDK スタックでは以下を構築します。

- **Amazon Cognito**：ユーザープール＋Hosted UI 用クライアント。
- **Amazon DynamoDB**：歌詞・注釈・ドキュメントバージョン用テーブル（オーナー GSI、PITR）。
- **AWS Lambda (Node.js 20)**：REST API を提供する単一関数。
- **Amazon API Gateway (HTTP API)**：JWT オーソライザ、CORS、ルートマッピング。
- **Amazon S3 + CloudFront**：SPA（`frontend/dist`）をホストするバケット＆ディストリビューション。

### デプロイ手順

```bash
npm install --prefix infra
npm run build --prefix infra
npm run synth --prefix infra
npm run deploy --prefix infra
```

デプロイ前にフロントエンドをビルドしておくと、最新ビルド成果物を S3 にアップロードできます。

```
npm run build --prefix frontend
```

CI/CD で必要なシークレット：

- `AWS_DEPLOY_ROLE`
- `WEB_BUCKET`
- `CLOUDFRONT_DISTRIBUTION`

## API リファレンス v1

- `POST /v1/lyrics`：歌詞ドキュメント作成。
- `GET /v1/lyrics?mine=true`：自分のドキュメント一覧。
- `GET /v1/lyrics/{docId}`：歌詞＋注釈取得（所有者のみ）。
- `PUT /v1/lyrics/{docId}`：歌詞更新（`X-Doc-Version` による楽観ロック必須）。
- `DELETE /v1/lyrics/{docId}`：削除（所有者のみ）。
- `POST /v1/lyrics/{docId}/share`：公開状態の切替。
- `POST /v1/lyrics/{docId}/annotations`：注釈追加（重複範囲は 400）。
- `PUT /v1/lyrics/{docId}/annotations/{annotationId}`：注釈編集。
- `DELETE /v1/lyrics/{docId}/annotations/{annotationId}`：注釈削除。
- `GET /v1/lyrics/{docId}/versions`：バージョン一覧取得。
- `GET /v1/lyrics/{docId}/versions/{version}`：特定バージョンのスナップショット。
- `GET /v1/public/lyrics/{docId}`：公開ビュー（`isPublicView: true` の場合のみ）。

エラーは HTTP 仕様に従い、400（バリデーション）、403（認可）、404（未発見）、409（バージョン不一致）などで返ります。

## 今後の推奨ステップ

1. SPA を本番 Cognito＋API Gateway に向け、モック API を HTTP クライアントへ切り替える。
2. バックエンドテスト（DynamoDB Local など）や React Testing Library カバレッジを拡充。
3. インフラに WAF／レート制御／構造化ログ／アラームを追加して堅牢化。
4. CI/CD で SPA を自動デプロイし、デプロイ後に CloudFront をインバリデート。

快適なメロディへの注釈付けをどうぞ！ 🎶
