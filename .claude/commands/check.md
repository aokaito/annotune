# /check — コミット前品質チェック

Annotuneモノレポ全体のlint・typecheck・テストを順番に実行し、問題があればその場で修正してください。

## 実行ステップ

以下を **上から順に** 実行してください。いずれかのステップが失敗したら、修正してから次のステップへ進んでください。

### Step 1: Lint（フロントエンド）
```bash
npm --prefix frontend run lint
```

### Step 2: Lint（バックエンド）
```bash
npm --prefix backend run lint
```

### Step 3: 型チェック（フロントエンド）
```bash
npm --prefix frontend run typecheck
```

### Step 4: 型チェック（バックエンド）
```bash
npm --prefix backend run typecheck
```

### Step 5: ユニットテスト（フロントエンド）
```bash
npm --prefix frontend run test
```

### Step 6: ユニットテスト（バックエンド）
```bash
npm --prefix backend run test
```

## 結果レポート

全ステップ完了後、以下の形式で結果を報告してください：

```
## /check 結果

| ステップ | 結果 |
|---|---|
| Frontend lint | ✅ / ❌ エラー内容 |
| Backend lint  | ✅ / ❌ エラー内容 |
| Frontend typecheck | ✅ / ❌ エラー内容 |
| Backend typecheck  | ✅ / ❌ エラー内容 |
| Frontend test | ✅ N tests passed / ❌ エラー内容 |
| Backend test  | ✅ N tests passed / ❌ エラー内容 |

→ コミット可能 / 要修正
```

問題があった場合は修正内容も合わせて報告してください。
