# デザインガイドライン

Share House Portal - Premium Design System

関連: [README.md](./README.md) / [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) / [IMPROVEMENTS.md](./IMPROVEMENTS.md)

---

## 設計思想

- **Purpose**: 住人間の心理的ハードルを下げ、信頼感のあるコミュニティ空間をデジタルの側面から演出する。
- **Aesthetic**: 「Premium Modern Minimalism」。単なるシンプルさではなく、質感（テクスチャ）、光（ガラス）、奥行き（シャドウ）を感じさせる上質な体験を提供する。
- **Core Values**: 信頼感、親しみやすさ、洗練。

---

## 基本思想

- **Authenticity over Decoration**: 意味のない装飾は排除しつつも、ユーザーが「大切にされている」と感じる細部の質感を追求する。
- **Softness & Depth**: 直角を避け、2xl〜3xlの大きな角丸（softness）と、繊細な影（depth）を用いる。
- **Fluid Motion**: 全てのアクションには、物理演算に基づいたような滑らかなフィードバック（Framer Motion）を伴う。

---

## カラーパレット

Tailwind **Slate** スケールをベースに、鮮やかな **Brand (Emerald)** をアクセントとして使用。

| カテゴリ | 色 / 変数 | 用途 |
|----------|-----------|------|
| **Brand (Main)** | `brand-500` / `brand-600` | プライマリボタン、ブランドアイコン、重要なアクセント |
| **Brand (Deep)** | `brand-700` | テキストグラデーションの終点、ホバー状態 |
| **Success** | `success` (`#3d6b4a`) | 成功メッセージ、完了、チェック状態 |
| **Error** | `error` (`#8b4040`) | エラー、削除、警告 |
| **Background** | `slate-50` (`#f8fafc`) | ページ全体の背景 |
| **Surface** | `#ffffff` | カード、コンテナ（`premium-surface`） |
| **Text (Main)** | `slate-900` (`#0f172a`) | 見出し、メインテキスト |
| **Text (Body)** | `slate-600` | 本文、説明文 |
| **Text (Muted)** | `slate-400` | ラベル、補助情報、未入力状態 |
| **Border** | `slate-100` / `slate-200` | 区切り線、入力欄のボーダー |

---

## タイポグラフィ

- **Font**: Geist Sans / System UI
- **Headings**: `tracking-tight` / `font-bold` / `slate-900`
- **Labels**: `text-[10px]` / `font-bold` / `tracking-wider` / `uppercase` / `slate-400`
- **Body**: `text-sm` or `text-[15px]` / `leading-relaxed` / `slate-600`
- **Gradient**: 重要な見出しには `.text-gradient` を適用可能。

---

## コンポーネント・フィジックス

- **Corners (Border Radius)**:
  - Default Container: `rounded-2xl` (1rem)
  - Profile/Event Cards: `rounded-3xl` (1.5rem)
  - Buttons / Inputs: `rounded-full` or `rounded-2xl`
  - Floating Labels: `rounded-xl`
- **Shadows**:
  - `premium-surface`: `box-shadow: var(--premium-shadow)` (非常に深く、柔らかい影)
  - Interactive: Hover時に少し浮き上がる（y-offsetの減少、影の強まり）
- **Glassmorphism**:
  - `glass` クラスを使用。`bg-white/70` + `backdrop-blur-md` + `border-white/20`
  - モーダル、ヘッダー、モバイルナビなどで使用。

---

## アニメーション（Framer Motion）

- **Basic**: `duration: 0.4`, `ease: [0.23, 1, 0.32, 1]` (Quart out)
- **Entrance**: ページ遷移やリスト表示時は `y: 10` からのフェードインとスタッガー（時間差）を用いる。
- **Interaction**: ボタンクリック時は `scale(0.98)` 程度のわずかな縮小フィードバックを入れる。

---

## 文言（Voice & Tone）

- **Professional & Warm**: 丁寧でありながらも、コミュニティの温かさを感じさせる言葉遣い。
- **Clarity**: ユーザーが何をすべきかを明確に伝える。
- **Feedback**: 成功したときには、さりげなくポジティブなフィードバックを提供する。

---

## 新規ページ実装チェックリスト

- [ ] `slate` 以外のグレースケール（zinc, gray等）を使用していないか
- [ ] 直角（rounded-none）の要素が含まれていないか
- [ ] 影は `var(--premium-shadow)` を基準としているか
- [ ] ブランドカラーは `brand-500` 系に統一されているか
- [ ] 入力欄やボタンは十分な高さ（H-11/12）と余白を持っているか
- [ ] モバイルでのタップターゲット（44px以上）が確保されているか

---

## 避けるべき事項

- **Generic Themes**: 既視感のあるSaaS管理画面風のUI
- **Zinc/Neutral Colors**: 洗練さに欠ける無機質なグレー
- **Harsh Shadows**: 境界線の分かりすぎる強い影
- **Complexity**: 情報過多なレイアウト。余白を贅沢に使うこと。

---

## 参考リンク

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Physics](https://motion.dev/docs/physics)
- [Geist Sans Font](https://vercel.com/font)

