# Share House Portal - 機能的改善要件

## Phase 1: アーキテクチャ・コード品質

### 1.1 大規模コンポーネント分割

以下のファイルが300行超で単一責任原則違反:

- `profile-edit-form.tsx` (955行) → セクション別に分割
- `profile-detail.tsx` (715行) → MBTI、情報セクション別に分離
- `admin-user-list.tsx` (699行) → リスト、フィルター、編集UI分離
- `events-content.tsx` (652行) → カレンダー、リスト、フォーム分離
- `residents-grid.tsx` (635行) → グリッド、フィルター、検索分離
- `photo-lightbox.tsx` (557行) → ライトボックス、ナビ、アクション分離

### 1.2 ロギングユーティリティ

`src/lib/errors` に統一されたロギングユーティリティを提供:

- `logError(error, context?)`: エラー（例外、予期せぬ状態）→ Sentry送信対応
- `logWarning(message, context?)`: 警告（非推奨機能、パフォーマンス低下など）→ Sentry送信対応

**例外ケース（循環依存回避）:**
- `src/lib/i18n/index.ts`: errors → i18n のインポートがあるため、直接 `console.warn` を使用
- `src/lib/security/audit.ts`: 監査ログは `logWarning` 使用済み、CRITICAL/ERROR は監査専用出力
- `src/lib/utils/web-vitals.ts`: クライアント側デバッグ用スタイル付きログ

開発時のデバッグログ (`console.log`) は許容されるが、コミット前には削除を推奨。

### 1.3 非null アサーション (!) 削除

30ファイル以上で `!` 演算子を使用。ガード節またはOptionalで代替し、eslint `@typescript-eslint/no-non-null-assertion` を有効化する。

### 1.4 N+1 クエリ対策

`src/lib/residents/queries.ts:102` で O(n²) のフィルタリング:
```typescript
// 現在
.filter((mock) => !dbTeasers.some((db) => db.id === mock.id))

// 改善: Set使用で O(n)
const dbIds = new Set(dbTeasers.map(t => t.id));
.filter((mock) => !dbIds.has(mock.id))
```

---

## Phase 2: UX/UI 改善

### 2.1 アクセシビリティ強化

- 全画像に意味のある `alt` 追加
- ボタン・リンクに `aria-label` 追加
- トグルボタンに `aria-pressed` 追加
- モーダルに `role="dialog"` 追加
- キーボードナビゲーション改善

### 2.2 クライアント側バリデーション

現在サーバー側のみバリデーション。以下のフォームに zod + 即時フィードバックを追加:

- `profile-edit-form.tsx`
- `events-content.tsx`
- `bulletin-board.tsx`
- `share-item-form.tsx`

### 2.3 Image 最適化 ✅

`OptimizedAvatarImage` コンポーネントで統一:
- Next.js Image ベースの最適化
- レスポンシブサイズ対応
- フォールバック表示

---

## Phase 3: 機能的欠落対応

### 3.1 i18n トレイト配列化 ✅

`src/lib/i18n/mbti-types.ts` で型安全に定義済み:
```typescript
export const MBTI_TYPES = {
  INTJ: { traits: ["独立的", "戦略的", "分析的"] }
}
```

### 3.2 Mock データ条件化

本番環境でも mock データが混入する可能性あり。環境変数 `NEXT_PUBLIC_USE_MOCK_DATA` で制御する。

### 3.3 テストカバレッジ拡大

以下のアクションにテスト未実装:
- events actions
- share actions
- bulletin actions

---

## Phase 4: セキュリティ強化

### 4.1 型安全性向上

`as unknown as` パターンを削除し、zod parse で型検証する。

### 4.2 入力サニタイゼーション強化

SNS URL 正規表現が脆弱。DOMPurify 導入またはURL パース強化を検討。

---

## Phase 5: パフォーマンス

### 5.1 ISR 導入

静的ページに `revalidate` 設定を追加。

### 5.2 useMemo/useCallback 追加

大規模リストのフィルタリング、高頻度再計算値に適用。

---

## 良好な点 (対応不要)

- セキュリティ: rate limit, UUID検証, オリジン検証 ✓
- i18n: ほぼ完全に国際化対応 ✓
- エラーハンドリング: `logError` / `logWarning` 統一 ✓
- キャッシュ戦略: `CacheStrategy` で一元管理 ✓
