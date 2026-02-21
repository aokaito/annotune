# /new-api-endpoint — バックエンドAPIエンドポイント スキャフォールド

引数: `$ARGUMENTS`
例: `recordings POST`, `comments GET /v1/lyrics/{docId}/comments`

Annotuneバックエンドのアーキテクチャパターンに従って、新しいAPIエンドポイントを一から実装してください。

## Annotuneのバックエンドアーキテクチャ

```
Router (handlers/router.ts)
  └─ Handler (handlers/xxx.ts)
       └─ Repository (repositories/XxxRepository.ts)
            └─ DynamoDB
```

- Serviceレイヤーは「リポジトリのシングルトンファクトリ」として機能する（`services/xxxService.ts`）
- バリデーションはZodスキーマで行う（`schemas/xxx.ts`）
- 認証は `getAuthenticatedUser(event)` で取得
- エラーは `HttpError` / `NotFoundError` で統一
- レスポンスは `jsonResponse(statusCode, data)` を使用

## 実装ステップ

### Step 1: 要件の把握

引数（`$ARGUMENTS`）からリソース名・HTTPメソッド・パスを解析してください。
不明な点があればユーザーに確認してください。

### Step 2: Zodスキーマの作成（`backend/src/schemas/`）

`backend/src/schemas/lyrics.ts` を参考に、新リソース用のZodスキーマを作成してください。
既存ファイルに追記するか新規ファイルを作成するか、内容に応じて適切に判断してください。

### Step 3: Repositoryの作成（`backend/src/repositories/`）

`backend/src/repositories/LyricsRepository.ts` を参考に以下を実装してください：
- DynamoDBDocumentClientとTableConfigをコンストラクタで受け取るクラス
- CRUD操作に応じたメソッド
- `ConditionalCheckFailedException` の適切なハンドリング
- `nanoid` を使ったID生成（`import { nanoid } from '@annotune/common'`）

### Step 4: Serviceの作成（`backend/src/services/`）

`backend/src/services/lyricsService.ts` を参考に、リポジトリのシングルトンファクトリを作成してください：
```typescript
let repository: XxxRepository | null = null;
export const getXxxRepository = () => {
  if (!repository) {
    repository = new XxxRepository(getDocumentClient(), getTableConfig());
  }
  return repository;
};
```

### Step 5: Handlerの作成（`backend/src/handlers/`）

`backend/src/handlers/lyrics.ts` を参考に、各エンドポイントのハンドラ関数を実装してください：
- `getAuthenticatedUser(event)` で認証
- Zodスキーマで入力バリデーション
- try/catchで `handleError(error)` を呼ぶ
- 適切なHTTPステータスコード（作成:201, 取得:200, 削除:204）

### Step 6: Routerへの登録（`backend/src/handlers/router.ts`）

`routeHandlers` オブジェクトに新しいルートを追加し、新ハンドラをimportしてください。
ルートキーのフォーマット: `'METHOD /v1/path'`

### Step 7: インフラ確認

新しいDynamoDBテーブルが必要な場合は、`infra/` ディレクトリ内のCDKスタックに追加が必要です。
その場合はユーザーに確認してください。

## 完了確認

実装後、以下を実行して問題がないことを確認してください：
```bash
npm --prefix backend run typecheck
npm --prefix backend run lint
npm --prefix backend run test
```
