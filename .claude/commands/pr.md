# /pr — プルリクエスト作成

現在のブランチの変更を分析し、Annotuneの慣習に合わせた日本語のPRを作成してください。

## 事前確認

まず以下を実行して現在の状態を把握してください：

```bash
git status
git diff main...HEAD
git log main..HEAD --oneline
```

未コミットの変更がある場合はユーザーに確認してください。

## PR作成手順

### Step 1: 変更内容の分析

- コミット履歴と差分から変更の全体像を把握する
- 変更の種類を特定する（新機能 / バグ修正 / リファクタリング / ドキュメント / インフラ）
- 影響範囲（frontend / backend / infra / packages/common）を確認する

### Step 2: /check の実行

PRを作る前に品質を確認してください：
```bash
npm --prefix frontend run lint
npm --prefix frontend run typecheck
npm --prefix frontend run test
npm --prefix backend run lint
npm --prefix backend run typecheck
npm --prefix backend run test
```

問題があれば先に修正してください。

### Step 3: PRの作成

以下のコマンドでPRを作成してください：

```bash
gh pr create --title "<タイトル>" --body "$(cat <<'EOF'
## 概要

<!-- 何をしたか・なぜしたかを2〜3行で説明 -->

## 変更内容

-
-

## 影響範囲

- [ ] フロントエンド（UI/コンポーネント）
- [ ] バックエンド（API/Lambda）
- [ ] インフラ（CDK/DynamoDB）
- [ ] 共通パッケージ

## テスト確認

- [ ] ユニットテスト（frontend/backend）
- [ ] 手動確認（モックモード）
- [ ] E2Eテスト（該当する場合）

## スクリーンショット

<!-- UIの変更がある場合はスクリーンショットを添付 -->

## 備考

<!-- レビュアーへの注意点・デプロイ手順・破壊的変更など -->
EOF
)"
```

## タイトルの命名規則

| 変更の種類 | プレフィックス例 |
|---|---|
| 新機能 | `〇〇機能を追加` |
| バグ修正 | `〇〇のバグを修正` |
| リファクタリング | `〇〇をリファクタリング` |
| パフォーマンス改善 | `〇〇のパフォーマンスを改善` |
| インフラ | `〇〇のインフラ設定を変更` |

タイトルは70文字以内・日本語で記述してください。

作成後、PR URLをユーザーに伝えてください。
