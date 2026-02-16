# デザインガイドライン

Share House Portal - immedio Style Design System

関連: [README.md](../README.md) / [CODING_GUIDELINES.md](./coding-guidelines.md) / [IMPROVEMENTS.md](./improvements.md)

---

## 設計思想

- **Purpose**: シンプルで機能的、モダンなコミュニティ空間を演出する。
- **Aesthetic**: 「immedio style」。クリーンで読みやすく、太字タイポグラフィを特徴とするモダンデザイン。
- **Core Values**: 明瞭性、効率性、アクセシビリティ。

---

## 基本思想

- **Clean & Minimal**: 不要な装飾を排除し、コンテンツに集中できるデザイン。
- **Bold Typography**: 太字の見出しで視覚階層を明確に。
- **Functional Colors**: シアン/ティールをアクセントに、落ち着いた配色で構成。

---

## カラーパレット

クリーム色をベースに、シアン/ティールをブランドカラーとして使用。

| カテゴリ | 変数 | 色味 | 用途 |
|----------|-----------|------|------|
| **Background** | `background` | Warm Cream (`#FDFCF8`) | ページ全体の背景 |
| **Brand (Main)** | `brand-500` | Cyan (`#06b6d4`) | メインアクション、アクセント |
| **Brand Scale** | `brand-50`〜`brand-900` | Cyan/Teal scale | ホバー、フォーカス、バリエーション |
| **Foreground** | `foreground` | Dark Earth (`#2F3E33`) | メインテキスト |
| **Accent** | `accent-base` | Cyan (`#06b6d4`) | 目立たせたいボタンやバッジ |
| **Border** | `border` | Warm Beige (`#E6E2D6`) | 区切り線 |
| **Success** | `success` | Muted Green (`#059669`) | 成功メッセージ |
| **Error** | `error` | Muted Red (`#8C5E5E`) | エラーメッセージ |

---

## タイポグラフィ

Google Fonts を使用。

- **全体**: "Noto Sans JP" - 日本語に最適化された読みやすいサンセリフ。見出し・本文共通。
- **見出し**: `font-weight: 700`〜`900`、`letter-spacing: -0.02em`〜`-0.03em`
- **本文**: `font-weight: 400`、`letter-spacing: 0.02em`、`line-height: 1.7`

### タイポグラフィユーティリティ

| クラス | 用途 | スタイル |
|--------|------|----------|
| `heading-hero` | ヒーローセクション | `text-3xl`〜`5xl`, `font-weight: 900` |
| `heading-page` | ページタイトル | `text-xl`〜`3xl`, `font-bold` |
| `heading-section` | セクション見出し | `text-lg`〜`xl`, `font-bold` |
| `heading-card` | カード見出し | `text-base`〜`lg`, `font-bold` |
| `subtitle` | サブタイトル | `text-base`, `text-muted-foreground` |
| `section-label` | セクションラベル | `text-sm`, `font-bold` |
| `label-uppercase` | 大文字ラベル | `text-[10px]`, `uppercase`, `tracking-widest` |

---

## コンポーネント・フィジックス

- **Corners**: `rounded-lg` (0.5rem) 〜 `rounded-xl` (0.75rem)。クリーンで現代的な角丸。
- **Shadows**: 控えめな影を使用。`border` で区切りを表現することを優先。
- **Cards**: `bg-card` + `border-border/60` で軽やかなカードスタイル。

---

## 新規ページ実装チェックリスト

- [ ] 背景色は真っ白ではなく `bg-background` (Cream) を使用しているか
- [ ] テキスト色は `text-slate-*` ではなく `text-foreground` / `text-muted-foreground` を使用しているか
- [ ] `bg-slate-*` ではなく `bg-secondary` / `bg-muted` を使用しているか
- [ ] ページタイトルは `heading-page` クラスを使用しているか
- [ ] サブタイトルは `subtitle` クラスを使用しているか
- [ ] 影は `shadow-sm` 等のトークンを使用し、独自に黒い影をつけていないか

---

## デザイントークン & ユーティリティ

- **Tokens**: `src/styles/tokens.css` - 角丸、影、スペーシング等の値を一元管理
- **Colors**: `src/app/globals.css` の CSS 変数（`--background`, `--brand-500` 等）を使用
- **Utilities**: `src/styles/utilities.css` のセマンティッククラスを使用
  - `card-base` / `card-interactive`: カード
  - `input-base` / `textarea-base`: 入力欄
  - `heading-page` / `heading-section` / `subtitle`: 見出し・サブタイトル
  - `alert-success` / `alert-error`: フィードバック

---

## 参考リンク

- [Noto Sans JP (Google Fonts)](https://fonts.google.com/noto/specimen/Noto+Sans+JP)
