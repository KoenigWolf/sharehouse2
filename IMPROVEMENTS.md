# Share House Portal - 改善計画書

最終更新: 2026-01-28

## 概要

プロジェクト全体を解析した結果、以下の改善点が特定されました。
このドキュメントは技術的負債と改善項目を追跡します。
実装時は [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) と [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md) に従ってください。

## クイックサマリー

- Phase 1 (高優先度): セキュリティ・パフォーマンス（5項目完了 ✅）
- Phase 2 (中優先度): アクセシビリティ・型安全性・エラー処理（5項目完了 ✅）
- Phase 3 (低優先度): テスト・ドキュメント・監視（3項目完了 ✅）

---

## 📋 進捗トラッカー

### フェーズ1: 高セキュリティ・パフォーマンス

- [x] 1.1 セッション有効期限の短縮 ✅
- [x] 1.2 検索機能にDebounce適用 ✅
- [x] 1.3 CSPポリシーの改善 ✅
- [x] 1.4 キャッシュ戦略の統一 ✅
- [x] 1.5 UUID検証の重複削除 ✅

### フェーズ2: コード品質

- [x] 2.1 Next.js Image コンポーネント導入 ✅
- [x] 2.2 アクセシビリティ改善 ✅
- [x] 2.3 エラーハンドリング強化 ✅
- [x] 2.4 型安全性の向上 ✅
- [x] 2.5 フォーム最適化 ✅

### フェーズ3: テスト・ドキュメント

- [x] 3.1 サーバーアクションのテスト追加 ✅
- [ ] 3.2 JSDocドキュメント追加
- [ ] 3.3 エラー追跡サービス統合
- [x] 3.4 パスワード強度チェック ✅

### フェーズ4: 継続改善

- [ ] 4.1 パフォーマンス監視
- [ ] 4.2 レート制限のRedis化
- [x] 4.3 モーション配慮（prefers-reduced-motion） ✅

---

## 🔴 高優先度改善項目（完了済み）

### 1.1 セッション有効期限の短縮 ✅

- `AUTH.sessionExpirationHours` を1週間→24時間に短縮
- 共有デバイスでのセキュリティリスク軽減、OWASP推奨値に準拠

### 1.2 検索機能にDebounce適用 ✅

- `residents-grid.tsx` に `useDebounce` を導入
- キーストロークごとの再フィルタリングを300msのdebounceで最適化

### 1.3 CSPポリシーの改善 ✅

- `'unsafe-inline'` `'unsafe-eval'` を削除し、nonce-based CSPに移行
- `middleware.ts` でnonce生成、`layout.tsx` で適用

### 1.4 キャッシュ戦略の統一 ✅

- `src/lib/utils/cache.ts` に `CacheStrategy` を集約
- 各アクションファイルの分散した `revalidatePath` を統一

### 1.5 UUID検証の重複削除 ✅

- `tea-time/actions.ts` の重複正規表現を `isValidUUID` に統一

---

## 🟡 中優先度改善項目

### 2.1 Next.js Image コンポーネント導入 ✅

- `OptimizedAvatarImage` コンポーネントを作成し全5コンポーネントで置き換え
- 自動WebP変換、遅延読み込み、レスポンシブ画像によりLCP 30-50%改善見込み

### 2.2 アクセシビリティ改善 ✅

- フォームボタンに `aria-busy` と動的 `aria-label` を追加
- エラー・成功メッセージに `role="alert"` / `role="status"` を追加
- モバイルナビのタッチターゲットをWCAG 44×44px基準にクリア

### 2.3 エラーハンドリング強化 ✅

- `error.tsx`、`global-error.tsx`、`matching.ts` の `console.error` を `logError` に置き換え
- エラー境界でNext.jsのdigestをメタデータとして記録

### 2.4 型安全性の向上 ✅

- `useOptimisticAction` の依存配列から `options` オブジェクトを除去
- `onSuccess`/`onError` を個別に抽出して依存配列に指定

### 2.5 フォーム最適化 ✅

- `interestsArray` と `completionItems` を `useMemo` 化
- 重複していた `interestsArray` 計算を統一
- `handleSubmit` を `useCallback` 化

---

## 🟢 低優先度改善項目

### 3.1 サーバーアクションのテスト追加 ✅

- `auth/actions.ts`（13テスト）、`profile/actions.ts`（8テスト）、`tea-time/actions.ts`（10テスト）
- Supabaseクライアントのモックで認証・バリデーション・DB操作をカバー

### 3.2 JSDocドキュメント追加

- 複雑なコンポーネント（ProfileDetail, ResidentsGrid, ProfileEditForm）、ユーティリティ関数、カスタムフック

### 3.3 エラー追跡サービス統合

- Sentry推奨（Next.jsサポート充実）
- `logError` ユーティリティと統合

### 3.4 パスワード強度チェック ✅

- 新規登録フォームにリアルタイム強度メーター（3段階: 弱/普通/強）を追加
- 長さ・大文字・小文字・数字・記号の複合スコアリング

---

## 📊 その他の推奨事項

- **パフォーマンス監視**: Web Vitals のレポート（Vercel Analytics等）
- **モーション配慮**: ✅ Framer Motion `MotionConfig reducedMotion="user"` でグローバル対応済み

---

## 🎯 実装優先度マトリックス

| 項目 | 優先度 | 影響度 | 状態 |
|------|--------|--------|------|
| セッション有効期限短縮 | 🔴 高 | 中 | ✅ |
| 検索Debounce適用 | 🔴 高 | 中 | ✅ |
| UUID検証統一 | 🔴 高 | 低 | ✅ |
| キャッシュ戦略統一 | 🔴 高 | 中 | ✅ |
| CSP改善 | 🔴 高 | 高 | ✅ |
| Next.js Image導入 | 🟡 中 | 高 | ✅ |
| アクセシビリティ改善 | 🟡 中 | 中 | ✅ |
| エラーハンドリング強化 | 🟡 中 | 中 | ✅ |
| 型安全性向上 | 🟡 中 | 低 | ✅ |
| フォーム最適化 | 🟡 中 | 中 | ✅ |
| テスト追加 | 🟢 低 | 高 | ✅ |
| JSDoc追加 | 🟢 低 | 低 | 未着手 |
| エラー追跡統合 | 🟢 低 | 高 | 未着手 |
| パスワード強度 | 🟢 低 | 低 | ✅ |
| モーション配慮 | 🟢 低 | 中 | ✅ |

---

## 📝 実装ログ

### 2026-01-28

#### フェーズ1: 高優先度改善
- [x] 1.1 セッション有効期限を24時間に短縮
- [x] 1.2 検索機能にDebounce適用
- [x] 1.5 UUID検証の重複削除
- [x] 1.4 キャッシュ戦略の統一（`cache.ts` 新規作成、3ファイルで使用）
- [x] 1.3 CSPポリシーをnonce-basedに移行
- [x] 2.1 Next.js Image コンポーネント導入（全5コンポーネント置き換え）
- [x] 2.2 アクセシビリティ改善（ARIA属性、タッチターゲット）

#### フェーズ2: コード品質改善
- [x] 2.3 エラーハンドリング強化（`logError` に統一、digest記録）
- [x] 2.4 型安全性の向上（`useOptimisticAction` 依存配列修正）
- [x] 2.5 フォーム最適化（`useMemo`/`useCallback` 導入、重複計算統一）

#### フェーズ3: テスト・セキュリティ
- [x] 3.1 サーバーアクションテスト追加（31テスト: auth 13, profile 8, tea-time 10）
- [x] 3.4 パスワード強度メーター（3段階リアルタイム表示）
- [x] 4.3 モーション配慮（`MotionConfig reducedMotion="user"` でグローバル対応）

#### リーダブルコード改善
- [x] `CODING_GUIDELINES.md` を作成
- [x] 不要コメントのクリーンアップ（約50件以上削除）
- [x] ESLint警告の修正
- [x] 全ビルド & テスト成功 ✅

---

## 💡 新機能アイデア

### 1. 住人の部屋自慢写真機能

- 各住人が自分の部屋の写真を投稿・共有できる機能
- Supabase Storageに保存、RLSで自分の写真のみ編集・削除可能
- DB: `room_photos` テーブル、Storage: `room-photos` バケット

### 2. Wi-Fi情報管理ページ

- 各階のWi-Fi情報（SSID、パスワード、備考）を集約管理
- パスワードはクリックでコピー可能、管理者のみ編集可能
- DB: `wifi_info` テーブル

### 3. ゴミ出しスケジュール管理 + プッシュ通知

- スケジュール管理、担当者ローテーション、通知機能
- 通知手段: Web Push API / メール（SendGrid） / LINE Notify
- スケジュール実行: Vercel Cron Jobs / Supabase Edge Functions
- DB: `garbage_schedule` テーブル

---

## 🔗 参考リンク

- [OWASP セキュリティガイド](https://owasp.org/)
- [WCAG 2.2 ガイドライン](https://www.w3.org/WAI/WCAG22/quickref/)
- [Next.js パフォーマンス最適化](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React 19 新機能](https://react.dev/blog/2024/04/25/react-19)
