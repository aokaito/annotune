# /deploy — AWS CDKデプロイ

引数: `$ARGUMENTS`（省略可。例: `staging`, `--hotswap`）

AnnotuneのインフラをAWS CDKで安全にデプロイします。
**必ずユーザーの確認を得てからデプロイを実行してください。**

## 事前チェック

### Step 1: ビルド確認

デプロイ前にフロントエンドとバックエンドをビルドしてください：

```bash
npm run build:frontend
npm run build:backend
```

ビルドが失敗した場合はデプロイを中止し、問題を修正してください。

### Step 2: CDK Synth（CloudFormationテンプレート生成）

```bash
npm run synth
```

エラーがないことを確認してください。

### Step 3: CDK Diff（変更内容の確認）

```bash
npm --prefix infra run diff
```

変更内容をユーザーに提示し、以下を明示してください：
- **追加されるリソース**（新規作成）
- **変更されるリソース**（設定変更）
- **削除されるリソース** ⚠️（特に注意が必要）

削除されるリソースがある場合は、その影響（データ消失リスク等）を必ず説明してください。

## デプロイ実行

### Step 4: ユーザー確認

必ず以下を確認してからデプロイしてください：

```
上記の変更内容でデプロイを実行しますか？
- 本番環境への変更は即座に反映されます
- DynamoDBテーブルの削除はデータの消失を伴います
```

**ユーザーが明示的に「はい」と回答した場合のみ** 次のステップに進んでください。

### Step 5: デプロイ実行

```bash
npm --prefix infra run deploy
```

引数（`$ARGUMENTS`）がある場合は適切に付与してください。

## デプロイ後確認

### Step 6: 動作確認

デプロイ完了後、以下を確認してください：

```bash
# CloudFront URLの確認
aws cloudformation describe-stacks --stack-name AnnotuneStack --query 'Stacks[0].Outputs'
```

- CloudFront URLにアクセスしてフロントエンドが表示されることを確認
- Lambda関数のステータスを確認
- 問題があればロールバック手順をユーザーに伝える

## 緊急ロールバック

デプロイ後に問題が発生した場合：
```bash
# CDKスタックを前のバージョンに戻す
aws cloudformation cancel-update-stack --stack-name AnnotuneStack
```

または git で前のコミットに戻してから再デプロイしてください。
