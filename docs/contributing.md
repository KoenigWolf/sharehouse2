# コントリビューションガイド

Share House Portal への貢献方法。

---

## 開発フロー

```text
1. Issue を確認・作成
2. ブランチを作成
3. 実装
4. テスト
5. PR を作成
6. レビュー
7. マージ
```

---

## 1. Issue の確認・作成

### 既存 Issue を探す

- [Bug](https://github.com/KoenigWolf/sharehouse2/labels/bug) - バグ報告
- [Enhancement](https://github.com/KoenigWolf/sharehouse2/labels/enhancement) - 機能要望
- [Good First Issue](https://github.com/KoenigWolf/sharehouse2/labels/good%20first%20issue) - 初心者向け

### 新しい Issue を作成

- バグ報告: Bug Report テンプレートを使用
- 機能要望: Feature Request テンプレートを使用

---

## 2. ブランチを作成

```bash
# main から最新を取得
git checkout main
git pull origin main

# ブランチを作成
git checkout -b <type>/<description>
```

### ブランチ命名規則

| Type | 用途 | 例 |
|------|------|-----|
| `feat/` | 新機能 | `feat/tea-time-matching` |
| `fix/` | バグ修正 | `fix/profile-upload-error` |
| `docs/` | ドキュメント | `docs/setup-guide` |
| `refactor/` | リファクタリング | `refactor/events-component` |
| `chore/` | その他 | `chore/update-dependencies` |

---

## 3. 実装

### コーディング規約

[coding-guidelines.md](./coding-guidelines.md) を参照。

### 主なルール

- コメントは「WHY」のみ
- `any` 禁止
- 1関数50行以内
- `logError` でエラーログ（`console.error` 禁止）
- i18n 経由で文字列表示

---

## 4. テスト

```bash
# 全チェック（コミット前に必須）
npm run check-all

# テストのみ
npm run test:run

# 型チェックのみ
npm run type-check

# Lint のみ
npm run lint
```

---

## 5. PR を作成

### PR タイトル

```text
<type>: <description>
```

例:
- `feat: Tea Time マッチング機能追加`
- `fix: プロフィール画像アップロードエラー修正`

### PR 本文

テンプレートに従って記入:

- **Summary**: 変更内容
- **Changes**: 主な変更点
- **Test Plan**: テスト方法
- **Screenshots**: UI変更がある場合
- **Related**: 関連 Issue（`Closes #123`）

### CI 実行

PR コメントで `/review` と投稿すると CI が実行される。

---

## 6. レビュー

### レビュー観点

- [ ] コーディング規約に従っているか
- [ ] テストが追加されているか
- [ ] i18n 対応されているか
- [ ] アクセシビリティに配慮されているか
- [ ] パフォーマンスに問題ないか

### レビューコメントへの対応

- 変更を加えたらコミット
- 対応完了したら "Resolve conversation"
- 全て対応完了したら再レビュー依頼

---

## 7. マージ

- レビュー承認後、Squash and merge
- ブランチは自動削除

---

## ローカル開発のヒント

### VS Code 拡張機能（推奨）

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens

### デバッグ

```bash
# 開発サーバー + デバッグログ
npm run dev

# Supabase ローカル
npx supabase start
```

### よくある問題

[troubleshooting.md](./troubleshooting.md) を参照。

---

## 質問・相談

- Issue を作成
- PR のコメント
- コードレビューで議論

---

## 行動規範

- 相手を尊重する
- 建設的なフィードバック
- 助け合いの精神
