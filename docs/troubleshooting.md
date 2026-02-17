# トラブルシューティング

よくある問題と解決方法。

---

## 開発環境

### `npm install` が失敗する

```bash
# node_modules と lock ファイルを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### `npm run dev` でポートが使用中

```bash
# 3000番ポートを使用しているプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>
```

### TypeScript エラーが大量に出る

```bash
# 型定義を再生成
npm run type-check

# それでも解決しない場合
rm -rf .next
npm run dev
```

---

## Supabase

### 認証エラー `Invalid login credentials`

- メールアドレスとパスワードを確認
- Supabase Dashboard > Auth > Users でユーザーが存在するか確認
- メール確認が必要な場合、確認メールのリンクをクリック

### RLS エラー `new row violates row-level security policy`

- Supabase Dashboard > Database > Policies でポリシーを確認
- `auth.uid()` が正しく取得できているか確認
- ログインしているか確認

### ストレージアップロードエラー

```bash
# バケットのポリシーを確認
npx supabase storage ls

# ファイルサイズ制限（5MB）を超えていないか確認
```

---

## ビルド・デプロイ

### `npm run build` が失敗する

```bash
# キャッシュをクリアしてビルド
rm -rf .next
npm run build
```

### ESLint エラー

```bash
# 自動修正を試す
npm run lint -- --fix
```

### 型エラー

```bash
# 型チェックを実行
npm run type-check
```

---

## GitHub Actions

### `/review` が動かない

1. PR のコメントか確認（Issue コメントでは動かない）
2. Actions タブでワークフロー実行履歴を確認
3. Settings > Actions > General で権限を確認
   - "Allow all actions and reusable workflows" を選択
   - "Workflow permissions" で "Read and write permissions" を選択

### ラベルが付かない

1. ラベルが存在するか確認（[github-workflows.md](./github-workflows.md) のコマンドで作成）
2. Actions の `pull-requests: write` 権限を確認

### Dependabot PR が来ない

1. Settings > Code security and analysis > Dependabot で有効化
2. `.github/dependabot.yml` が正しくコミットされているか確認

---

## Mobile (Expo)

### Metro バンドラーがクラッシュ

```bash
# キャッシュをクリア
cd mobile
npx expo start --clear
```

### iOS シミュレータが起動しない

```bash
# Xcode コマンドラインツールを確認
xcode-select --install

# シミュレータをリセット
xcrun simctl shutdown all
xcrun simctl erase all
```

### Android エミュレータが起動しない

```bash
# AVD Manager でエミュレータを確認
# Android Studio > Tools > AVD Manager

# 環境変数を確認
echo $ANDROID_HOME
```

---

## パフォーマンス

### ページ読み込みが遅い

1. Chrome DevTools > Network でリソースを確認
2. Chrome DevTools > Lighthouse でパフォーマンス分析
3. `npm run build && npm run start` で本番モードでテスト

### メモリリーク

1. Chrome DevTools > Memory でヒープスナップショット
2. React DevTools でコンポーネントのマウント/アンマウントを確認
3. `useEffect` のクリーンアップ関数を確認

---

## その他

### 解決しない場合

1. エラーメッセージで検索
2. [GitHub Issues](https://github.com/KoenigWolf/sharehouse2/issues) を確認
3. 新しい Issue を作成（テンプレートを使用）
