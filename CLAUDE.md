# Share House Portal

20人規模のシェアハウス住民専用ポータル。immedio スタイル（シンプル＆モダン）なデザイン。

## コマンド

- `npm run dev` - 開発サーバー
- `npm run check-all` - lint + type-check + test + build（コミット前に必ず実行）
- `npm run test:run` - テスト実行
- `npm run build` - 本番ビルド

## 技術スタック

Next.js 16 (App Router) / TypeScript / Tailwind CSS 4 / shadcn/ui / Supabase / Framer Motion

## コーディング規約

- コメントは「WHY」のみ。コードで説明できるWHATは書かない
- `any` 禁止。Boolean は `is/has/can`、関数は動詞で始める
- 1関数50行以内。早期リターン（ガード節）を使う
- エラーは `logError` ユーティリティを使う（`console.error` 禁止）
- null/undefined は「状態」か「前提違反」か判断し暗黙処理しない。nullable フィールドは `??` でフォールバック、前提違反はガード節か型で排除（`!` 禁止）
- 詳細: @docs/coding-guidelines.md

- スタイル値は `src/styles/tokens.css`、ユーティリティは `src/styles/utilities.css` で一元管理
- 直接 Tailwind クラスを羅列せず用途別クラスを使う（`card-base`, `input-base`, `alert-success` 等）
- 背景 Cream (`#FDFCF8`) / 見出し Dark Earth (`#2F3E33`) / ブランド Cyan (`#06b6d4`)
- フォント: Noto Sans JP（全体）- 日本語に最適化された読みやすいサンセリフ
- 詳細: @docs/design-guidelines.md

## レイアウト設計原則（人間工学・黄金比）

### スペーシング（黄金数列）
- 基本単位 8px から黄金比で展開: `8 → 13 → 21 → 34 → 55 → 89`
- Tailwind: `gap-2`(8) → `gap-3`(12) → `gap-5`(20) → `gap-8`(32) → `gap-14`(56)
- セクション間: `space-y-8`〜`space-y-10`、グループ間: `space-y-5`〜`space-y-6`

### タッチターゲット（Fitts' Law）
- 最小サイズ: 44×44px（モバイル）、40×40px（デスクトップ）
- ボタン高さ: `h-10`(40px)〜`h-12`(48px)、アイコンボタン: `w-10 h-10`
- 入力フィールド: `h-12`(48px)〜`h-13`(52px)

### 視覚階層
- F-pattern: 重要情報は左上→右→下の流れに配置
- Primary → Secondary → Tertiary の3段階で情報を整理
- タイトル: `text-xl`〜`text-2xl font-semibold`、サブ: `text-sm text-muted-foreground`

### アスペクト比
- カバー画像: `aspect-[1.618/1]`（黄金比）または `aspect-[16/9]`
- カード: 正方形アバター + 下部コンテンツ
- サムネイル: `aspect-square`

### アニメーション
- イージング: `[0.25, 0.46, 0.45, 0.94]`（自然な減速）
- 持続時間: 0.2〜0.4秒、stagger: 0.03〜0.06秒
- ホバー: `scale: 1.02〜1.05`、`y: -2〜-3`

### コントロール配置
- 関連するコントロールはグループ化（Gestalt: 近接）
- フィルター・ソートは sticky header でアクセス維持
- アクションボタンは右寄せ（`justify-end`）

## プロジェクト構成

- `src/app/` - ページ（App Router）
- `src/components/` - UIコンポーネント
- `src/lib/` - ビジネスロジック・サーバーアクション・ユーティリティ
- `src/domain/` - ドメイン型・バリデーション
- `src/hooks/` - カスタムフック
- `src/__tests__/` - テスト

## 重要な規約

- サーバーアクションの戻り値は `{ success: true }` | `{ error: string }` のユニオン型
- ユーザーに表示される文字列は全て i18n 経由にする（ハードコード禁止）。クライアント: `useI18n` フック、サーバー: `getServerTranslator()`。キーは `src/lib/i18n/ja.ts` と `en.ts` の両方に追加する
- アバター画像は `OptimizedAvatarImage` コンポーネントを使う（Next.js Image ベース）
- framer-motion は `m` コンポーネントを優先（`motion` は layoutId 使用時のみ）
- レート制限は `checkRateLimit` / `checkRateLimitAsync`（Redis 対応）
