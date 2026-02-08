# デザインガイドライン

Share House Portal - Modern Homestead Design System

関連: [README.md](../README.md) / [CODING_GUIDELINES.md](./coding-guidelines.md) / [IMPROVEMENTS.md](./improvements.md)

---

## 設計思想

- **Purpose**: 自然と調和する、温かみのあるコミュニティ空間を演出する。
- **Aesthetic**: 「Modern Homestead (現代的な農家スタイル)」。素朴さ（Rustic）と洗練（Modern）の融合。
- **Core Values**: 温もり、自然、伝統、信頼。

---

## 基本思想

- **Organic & Authentic**: テック感のある冷たさを排除し、手触り感のある有機的なデザインを目指す。
- **Friendly & Approachable**: 丸みのあるサンセリフで親しみやすさを演出。
- **Soft & Warm**: 鋭利な角や強いコントラストを避け、アースカラーと柔らかな影で構成する。

---

## カラーパレット

温かみのあるクリーム色をベースに、深みのあるオリーブグリーンとアースカラーを使用。

| カテゴリ | 変数 | 色味 | 用途 |
|----------|-----------|------|------|
| **Background** | `background` | Warm Cream (`#FDFCF8`) | ページ全体の背景 |
| **Brand (Main)** | `brand-500` | Deep Olive (`#4A6741`) | メインアクション、アクセント |
| **Foreground** | `foreground` | Dark Earth (`#2F3E33`) | メインテキスト |
| **Accent** | `accent-base` | Muted Gold (`#E0B06B`) | 目立たせたいボタンやバッジ |
| **Border** | `border` | Warm Beige (`#E6E2D6`) | 区切り線 |
| **Success** | `success` | Muted Green (`#5D7556`) | 成功メッセージ |
| **Error** | `error` | Muted Earth Red (`#8C5E5E`) | エラーメッセージ |

---

## タイポグラフィ

Google Fonts を使用。

- **全体**: "Lato" - 丸みがあり、読みやすく温かみのあるサンセリフ。見出し・本文共通。
- **装飾（任意）**: "Dancing Script" - 手書きの温もり（ロゴや特別な装飾に限定使用）。

---

## コンポーネント・フィジックス

- **Corners**: `rounded-lg` (0.5rem) 〜 `rounded-2xl` (1rem)。少し引き締まった角丸で「道具」としての実直さを表現。
- **Shadows**: 濃い灰色の影ではなく、濃い緑（Dark Earth）をベースにした影を使用し、馴染ませる。
- **Texture**: 紙や布のような質感を意識（実装上はソリッドカラーだが、配色はテクスチャを感じさせるものを選択）。

---

## 新規ページ実装チェックリスト

- [ ] 背景色は真っ白ではなく `bg-background` (Cream) を使用しているか
- [ ] テキスト色は `text-slate-*` ではなく `text-foreground` / `text-muted-foreground` を使用しているか
- [ ] `bg-slate-*` ではなく `bg-secondary` / `bg-muted` を使用しているか
- [ ] 影は `shadow-sm` 等のトークンを使用し、独自に黒い影をつけていないか

---

## デザイントークン & ユーティリティ

- **Tokens**: `src/styles/tokens.css` - 角丸、影、スペーシング等の値を一元管理
- **Colors**: `src/app/globals.css` の CSS 変数（`--background`, `--brand-500` 等）を使用
- **Utilities**: `src/styles/utilities.css` のセマンティッククラスを使用
  - `card-base` / `card-interactive`: カード
  - `input-base` / `textarea-base`: 入力欄
  - `heading-page` / `heading-section`: 見出し
  - `alert-success` / `alert-error`: フィードバック

---

## 参考リンク

- [Lato (Google Fonts)](https://fonts.google.com/specimen/Lato)
- [Dancing Script (Google Fonts)](https://fonts.google.com/specimen/Dancing+Script)

