# GitHub ワークフロー & 自動化

Share House Portal の CI/CD と GitHub 自動化機能のガイド。

---

## ワークフロー一覧

| ワークフロー | トリガー | 目的 |
|-------------|---------|------|
| PR Review | `/review` コメント | オンデマンドで CI チェック実行 |
| PR Labeler | PR 作成/更新 | サイズ・種別ラベル自動付与 |
| Security Check | 依存関係変更時 + 週次 | npm audit によるセキュリティ監査 |
| Stale Management | 日次 | 放置 Issue/PR の自動クローズ |

---

## PR Review (`/review`)

**PR コメントに `/review` と書くと CI が実行される。**

コスト節約のため、push ごとの自動実行ではなくオンデマンド方式を採用。

### 使い方

1. PR のコメント欄に `/review` と投稿
2. 🚀 リアクションが付いたら実行開始
3. 完了後、結果がコメントされる（✅ passed / ❌ failed）

### 実行内容

```bash
npm run check-all  # lint + type-check + test + build
```

### 注意事項

- PR 以外のコメント（Issue など）では動作しない
- `/review` が含まれていれば OK（例: `/review お願いします`）

---

## PR Labeler

**PR 作成/更新時に自動でラベルを付与する。**

### サイズラベル

変更行数（追加 + 削除）に応じて付与：

| ラベル | 変更行数 |
|--------|---------|
| `size/XS` | 〜10 行 |
| `size/S` | 〜50 行 |
| `size/M` | 〜200 行 |
| `size/L` | 〜500 行 |
| `size/XL` | 500 行〜 |

### 種別ラベル

変更ファイルのパスに応じて付与：

| ラベル | 対象パス |
|--------|---------|
| `frontend` | `src/`（テスト除く） |
| `mobile` | `mobile/` |
| `tests` | `__tests__/`, `.test.`, `.spec.` |
| `docs` | `*.md`, `docs/` |
| `config` | `.github/`, `package.json`, `tsconfig.json` |
| `database` | `supabase/`, `migrations/` |

---

## Security Check

**依存関係の脆弱性をチェックする。**

### 実行タイミング

- `package.json` または `package-lock.json` を含む PR
- 毎週月曜 9:00 JST（定期実行）
- 手動実行（Actions タブから）

### 動作

1. Web アプリ（`/`）と Mobile アプリ（`/mobile`）の両方を監査
2. High / Critical レベルの脆弱性がある場合、PR にコメント
3. 脆弱性がなければコメントなし

### ローカルで確認

```bash
# 脆弱性の確認
npm audit

# 自動修正（可能な場合）
npm audit fix
```

---

## Stale Management

**放置された Issue/PR を自動でクローズする。**

### Issue

- **30日** 更新なし → `stale` ラベル + 警告コメント
- さらに **14日** 更新なし → 自動クローズ

### PR

- **21日** 更新なし → `stale` ラベル + 警告コメント
- さらに **7日** 更新なし → 自動クローズ

### 除外ラベル

以下のラベルが付いている場合はクローズされない：

- `pinned` - 固定
- `in-progress` - 作業中
- `blocked` - ブロック中
- `dependencies` - 依存関係更新（PR のみ）

マイルストーンが設定されている場合も除外。

---

## Dependabot

**依存関係の更新 PR を自動作成する。**

### スケジュール

- 毎週月曜 9:00 JST

### 設定

| 対象 | PR 上限 | グループ化 |
|------|---------|-----------|
| Web (`/`) | 5件 | minor + patch をまとめる |
| Mobile (`/mobile`) | 3件 | minor + patch をまとめる |
| GitHub Actions | - | 月次更新 |

### 注意事項

- **Major バージョンは自動更新しない**（手動対応）
- PR には `dependencies` ラベルが付く
- マージ前に `/review` で CI 確認を推奨

---

## テンプレート

### PR テンプレート

PR 作成時に自動で表示されるテンプレート。

```markdown
## Summary
## Changes
## Test Plan
## Screenshots
## Related
```

### Issue テンプレート

Issue 作成時に選択できるフォーム：

- **Bug Report** - バグ報告（再現手順、環境情報など）
- **Feature Request** - 機能要望（課題、提案、優先度）
- **Blank Issue** - 自由形式

---

## ラベル作成（初回のみ）

ワークフローが使用するラベルを事前に作成しておく：

```bash
# サイズラベル
gh label create "size/XS" --color "3CBF00" --description "Extra small PR"
gh label create "size/S" --color "5D9801" --description "Small PR"
gh label create "size/M" --color "7F7203" --description "Medium PR"
gh label create "size/L" --color "A14C05" --description "Large PR"
gh label create "size/XL" --color "C32607" --description "Extra large PR"

# 種別ラベル
gh label create "frontend" --color "1D76DB" --description "Web frontend changes"
gh label create "mobile" --color "7057FF" --description "Mobile app changes"
gh label create "tests" --color "FEF2C0" --description "Test changes"
gh label create "docs" --color "0075CA" --description "Documentation"
gh label create "config" --color "D4C5F9" --description "Configuration changes"
gh label create "database" --color "F9D0C4" --description "Database/migration changes"

# 状態ラベル
gh label create "stale" --color "CCCCCC" --description "Stale issue/PR"
gh label create "in-progress" --color "FBCA04" --description "Work in progress"
gh label create "blocked" --color "B60205" --description "Blocked by external factor"
gh label create "pinned" --color "006B75" --description "Pinned issue"
```

---

## トラブルシューティング

### `/review` が動かない

1. PR のコメントか確認（Issue コメントでは動かない）
2. Actions タブでワークフロー実行履歴を確認
3. リポジトリの Settings > Actions で権限を確認

### ラベルが付かない

1. ラベルが存在するか確認（上記コマンドで作成）
2. Actions の `pull-requests: write` 権限を確認

### Dependabot PR が来ない

1. Settings > Code security and analysis で Dependabot を有効化
2. `.github/dependabot.yml` が正しくコミットされているか確認
