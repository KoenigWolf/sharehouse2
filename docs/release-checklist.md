# リリースチェックリスト

本番デプロイ前の確認項目。

---

## コード品質

- [ ] `npm run check-all` が通る
  - [ ] ESLint エラーなし
  - [ ] TypeScript エラーなし
  - [ ] テスト全件パス
  - [ ] ビルド成功

- [ ] PRレビュー完了
- [ ] `/review` で CI パス確認

---

## 機能確認

- [ ] 新機能の動作確認
- [ ] 既存機能のリグレッションテスト
- [ ] モバイル表示確認
- [ ] 日本語/英語の両方で表示確認

---

## セキュリティ

- [ ] `npm audit` で High/Critical なし
- [ ] 環境変数に機密情報がコミットされていない
- [ ] RLS ポリシーが適切に設定されている
- [ ] 入力バリデーションが実装されている

---

## パフォーマンス

- [ ] Lighthouse スコア確認
  - [ ] Performance: 90+
  - [ ] Accessibility: 90+
  - [ ] Best Practices: 90+
  - [ ] SEO: 90+

- [ ] Core Web Vitals 確認
  - [ ] LCP < 2.5s
  - [ ] CLS < 0.1
  - [ ] INP < 200ms

---

## データベース

- [ ] マイグレーションが適用されている
- [ ] 本番データのバックアップ確認
- [ ] ロールバック手順の確認

---

## 環境変数

- [ ] 本番環境の環境変数が設定されている
- [ ] Vercel の Environment Variables を確認
- [ ] Supabase の本番プロジェクトを使用

---

## 監視

- [ ] Sentry のエラー監視が有効
- [ ] Web Vitals の計測が有効
- [ ] デプロイ通知の設定確認

---

## ドキュメント

- [ ] CHANGELOG 更新
- [ ] 必要に応じて docs 更新
- [ ] Breaking Changes の記載

---

## デプロイ

- [ ] ステージング環境でテスト
- [ ] 本番デプロイ実行
- [ ] デプロイ後の動作確認
- [ ] エラー監視の確認（Sentry）

---

## ロールバック手順

問題が発生した場合：

```bash
# Vercel でのロールバック
# 1. Vercel Dashboard > Deployments
# 2. 前回の成功デプロイを選択
# 3. "..." > "Promote to Production"

# または CLI で
vercel rollback
```

### DB マイグレーションのロールバック

```bash
# マイグレーション履歴確認
npx supabase migration list

# ロールバック（手動で逆マイグレーションを作成）
npx supabase migration new rollback_xxx
```

---

## 緊急連絡先

| 担当 | 連絡先 |
|------|--------|
| 開発リード | - |
| インフラ | - |
| Supabase サポート | https://supabase.com/support |
| Vercel サポート | https://vercel.com/support |
