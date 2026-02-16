# Share House Portal - 改善計画書

関連: [README.md](../README.md) / [DESIGN_GUIDELINES.md](./design-guidelines.md) / [CODING_GUIDELINES.md](./coding-guidelines.md)

## 進捗サマリー

全フェーズ完了。

| フェーズ | 内容 | 状態 |
|---------|------|------|
| Phase 1 | セキュリティ・パフォーマンス（5項目） | 完了 |
| Phase 2 | アクセシビリティ・型安全性・エラー処理（5項目） | 完了 |
| Phase 3 | テスト・ドキュメント・監視（4項目） | 完了 |
| Phase 4 | パフォーマンス監視・Redis化（3項目） | 完了 |

---

## Phase 1: セキュリティ・パフォーマンス

- [x] セッション有効期限を24時間に短縮（OWASP準拠）
- [x] 検索にDebounce適用（300ms）
- [x] CSPをnonce-basedに移行
- [x] キャッシュ戦略を `cache.ts` に統一
- [x] UUID検証の重複削除

## Phase 2: コード品質

- [x] Next.js Image導入（`OptimizedAvatarImage`、全5コンポーネント）
- [x] アクセシビリティ改善（ARIA属性、タッチターゲット44px）
- [x] エラーハンドリング強化（`logError`統一、digest記録）
- [x] 型安全性の向上（`useOptimisticAction`依存配列修正）
- [x] フォーム最適化（`useMemo`/`useCallback`導入）

## Phase 3: テスト・ドキュメント

- [x] サーバーアクションテスト追加（auth 13、profile 8、tea-time 10）
- [x] JSDocドキュメント追加（コンポーネント・フック・アクション・ユーティリティ）
- [x] Sentryエラー追跡統合（クライアント/サーバー/エッジ）
- [x] パスワード強度メーター（3段階リアルタイム表示）

## Phase 4: 継続改善

- [x] Web Vitals監視（LCP, CLS, FCP, TTFB, INP）
- [x] レート制限のRedis対応（未設定時はインメモリフォールバック）
- [x] モーション配慮（`MotionConfig reducedMotion="user"`）

---

## パフォーマンス最適化（追加対応）

- [x] Rate Limitストアの無制限増大修正（MAX_STORE_SIZE=10,000）
- [x] framer-motionバンドル最適化（LazyMotion + domAnimation + `m`化）
- [x] Sentry二重送信修正
- [x] ioredis動的import化（クライアントバンドルから除外）
- [x] `useLocale`フック新設（normalizeLocale重複排除）
- [x] translate() RegExp → `String.replaceAll`
- [x] getInitials重複コード除去

---

## 実装済み機能

- [x] **ルームフォトギャラリー**: 部屋写真の投稿・共有（HEIC対応・自動圧縮）
- [x] **Wi-Fi情報管理**: 各階のSSID・パスワードを情報ページで集約管理
- [x] **ゴミ出しスケジュール**: 担当ローテーション表示

---

## 参考リンク

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Sentry Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Web Vitals](https://web.dev/articles/vitals)
- [Supabase ドキュメント](https://supabase.com/docs)
