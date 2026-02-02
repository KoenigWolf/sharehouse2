# Share House Portal

20人規模のシェアハウス住民専用ポータル。無印良品的な静かなUI。

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
- 詳細: @CODING_GUIDELINES.md

## デザイン指針

- 背景 `#fafafa` / テキスト `#18181b` / ボーダー `#e4e4e7`
- 角丸は控えめに（アバター: `rounded-full` / ボタン・入力: `rounded-md` / カード: `rounded-lg`）。影は極力使わない。装飾禁止
- アニメーションは 0.2〜0.3秒、静かに
- フィードバックは左ボーダーのみ（エラー `#e5a0a0` / 成功 `#93c5a0`）
- 詳細: @DESIGN_GUIDELINES.md

## プロジェクト構成

- `src/app/` - ページ（App Router）
- `src/components/` - UIコンポーネント
- `src/lib/` - ビジネスロジック・サーバーアクション・ユーティリティ
- `src/domain/` - ドメイン型・バリデーション
- `src/hooks/` - カスタムフック
- `src/__tests__/` - テスト

## 重要な規約

- サーバーアクションの戻り値は `{ success: true }` | `{ error: string }` のユニオン型
- i18n は `useI18n` フック / `t()` 関数を使う（日本語・英語対応）
- アバター画像は `OptimizedAvatarImage` コンポーネントを使う（Next.js Image ベース）
- framer-motion は `m` コンポーネントを優先（`motion` は layoutId 使用時のみ）
- レート制限は `checkRateLimit` / `checkRateLimitAsync`（Redis 対応）
