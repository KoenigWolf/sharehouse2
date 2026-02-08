# Share House Portal

20人規模のシェアハウス住民専用ポータル。洗練されたプレミアム・モダン・ミニマリズム。

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
- 背景 `slate-50` / 見出し `slate-900` / ブランド `brand-500` (Emerald)
- 詳細: @docs/design-guidelines.md

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
