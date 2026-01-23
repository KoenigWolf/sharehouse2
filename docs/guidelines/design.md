# DESIGN.md

---

# 設計思想

## 1. 前提

* 目的: 誰がどんな人かが分かり、声をかける心理的ハードルを下げる
* 規模: 最大20人・クローズド
* 重要度: UX・空気感が最重要。パフォーマンス・スケールは不要
* 技術方針: 最強構成ではなく、最短で気持ちいいもの

SaaSではなく、デジタル掲示板＋名簿＋ゆるいSNS

---

## 2. 技術スタック

### フロントエンド

* Next.js 15 (App Router)
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion (軽めのアニメーション)

理由:

* 開発体験が良い
* Cursor + Claude Code と相性が良い
* UIを壊しにくく、継続的な実装に耐える

### バックエンド

* Supabase (無料枠)

  * PostgreSQL
  * Auth (ID/パスワード)
  * Storage (画像アップロード)
  * Row Level Security

採用しない:

* Firebase（過剰）
* 自前Auth（無駄）
* Prisma + 別DB（学習コスト増）

---

## 3. UI / UX 方針（全体）

### 避けるもの

* 無機質
* SaaS管理画面風
* 白黒ベース＋角ばったカード
* 目立たせるためだけの装飾

### 採用する方向性

* 明るいが静か
* ポップだが主張しない
* 人の気配が感じられる

### UI要素

* トップ: 住民の顔写真グリッド、名前＋一言
* プロフィール: 写真必須、短文自己紹介、最近ハマっていること
* 色: パステル寄り、シャドウは弱め
* 動き: hoverでわずかに反応、モーダルは静かに表示

Framer Motion は 補助的にのみ使用する。

---

## 4. 機能

### 初期必須

* ログイン / ログアウト
* プロフィール閲覧
* 自分のプロフィール編集
* 顔写真アップロード

### あると良い

* 一言ステータス
* タグ (#映画好き #夜型 #猫好き)
* 最終ログイン表示（控えめ）

### 不要

* いいね
* コメント
* DM
  → 人間関係が重くなるため実装しない

---

## 5. 要件定義

### 概要

20人規模のシェアハウス住民向けに、
関係性を可視化・促進するクローズドなポータルサイト。

### 技術スタック

Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Framer Motion

### 認証

* Supabase Auth（ID/パスワード）
* 未ログイン時は全ページアクセス不可

### ユーザー

* 最大20人
* 管理者なし
* 自分のプロフィールのみ編集可能

### プロフィール

* id
* name
* avatarUrl（必須）
* bio
* statusMessage
* tags
* createdAt
* updatedAt

### 機能

* ログイン / ログアウト
* 住民一覧（顔写真グリッド、名前＋一言）
* プロフィール詳細
* プロフィール編集（自分のみ、RLS）
* 画像アップロード（Supabase Storage）

### 非要件

* パフォーマンス最適化不要
* スケーラビリティ考慮不要
* 外部公開不要

---

## 6. ティータイム機能

### 概念

マッチング機能ではなく、
偶発的な1on1のきっかけを作る仕組み。

* 目的: 偶発的な1on1を発生させる
* ゴール: 顔と名前が一致し、声をかけやすくなる
* 性質: 軽い / 強制しない / 失敗しても気まずくならない

イベントではなく「仕組み」として存在する。

### 要件

概要:

* ランダム1on1ティータイム機能
* 参加ONのユーザーのみ対象
* システムが自動マッチング
* マッチ時のみ発生

基本ルール:

* 明示的に参加ONにしたユーザーのみ対象
* いつでもON / OFF切り替え可能
* 必ず2人でマッチ
* 自分自身とはマッチしない
* 同じ相手と短期間で連続マッチしない

UXルール:

* マッチしなかった回は何も起きない
* マッチ不成立は表示しない
* 起きたときだけ存在する仕組み

ユーザー操作:

* 設定: ティータイム参加ON/OFF、希望時間帯（朝/昼/夜、任意）
* マッチ時: 相手の顔写真・名前・一言を表示
  文言は「今日どこかでお茶しよう」程度に留める

データモデル:

* tea_time_settings: user_id, is_enabled, preferred_time
* tea_time_matches: id, user1_id, user2_id, matched_at, status

非要件:

* チャット機能
* 強制参加
* 日程調整
* 評価 / いいね

---

## 7. デザインガイドライン（無印良品思想ベース）

### 7.1 基本思想

* デザインは主張しない
* 情報を静かに整理する
* 理由のない装飾は禁止

デザインは「主役」ではなく「環境」である。

---

### 7.2 カラー

* ベース: 生成り寄りの白、薄いグレー
* 純白・純黒は禁止
* アクセントカラーは低彩度・最小限
* 雰囲気作りのために色を増やさない

---

### 7.3 タイポグラフィ

* フォントは1種
* 太字の多用禁止
* 強調はサイズ・余白・配置で行う
* 見出しも装飾しない

---

### 7.4 レイアウト・余白

* 余白は情報整理のために使う
* 要素を詰めない
* 中央寄せの多用は禁止
* グリッドは必ず揃える

---

### 7.5 コンポーネント

* 影は極力使わない
* 角丸は控えめ
* 枠線は整理目的でのみ使用
* コンポーネントは再利用前提で設計する

---

### 7.6 アニメーション

* 目立たせるための動きは禁止
* hover / modal のみ静かに使用
* バウンド・派手な演出は禁止

---

### 7.7 文言

* 命令口調禁止
* 感情を煽らない
* 成功・失敗ともに淡々と伝える

---

### 7.8 明確な禁止事項

* SaaS管理画面風UI
* グラデーション多用
* 強い影
* 意味のないアイコン・装飾

---

## 8. 新規ページ実装時チェック

* 情報は減らせないか
* 色を使う理由を説明できるか
* 余白が削られていないか
* 既存ページと空気感が一致しているか
* 無印良品のサイトに自然に置けるか

---

## 9. 実装ガイドライン（具体的なコード指針）

### 9.1 カラーパレット

```
// ベースカラー
背景（メイン）     : #fafaf8  （生成り寄りの白）
背景（セカンダリ） : #f5f5f3  （わずかに暗い生成り）
白（カード・入力） : #ffffff  （純白は入力欄など限定的に）

// テキスト
テキスト（メイン） : #1a1a1a  （純黒ではない黒）
テキスト（説明）   : #737373  （説明文・ラベル）
テキスト（補助）   : #a3a3a3  （プレースホルダー・注釈）
プレースホルダー   : #d4d4d4  （入力欄のヒント）

// ボーダー
ボーダー（通常）   : #e5e5e5  （区切り線・枠線）

// フィードバック（低彩度）
エラー背景         : #faf8f8
エラーボーダー     : #c9a0a0  （くすんだ赤）
エラーテキスト     : #8b6b6b
成功背景           : #f8faf8
成功ボーダー       : #a0c9a0  （くすんだ緑）
成功テキスト       : #6b8b6b

// ボタン
ボタン（プライマリ）: #1a1a1a → hover: #333333
ボタン（無効）     : #a3a3a3
```

---

### 9.2 スペーシング

```
// 余白の基準（Tailwind）
極小   : 1 (4px)   - 要素内の微調整
小     : 2 (8px)   - ラベルと入力欄の間
中     : 4 (16px)  - セクション内の要素間
大     : 6 (24px)  - フォーム要素間
特大   : 8 (32px)  - セクション間
巨大   : 12 (48px) - 大きなブロック間

// 実践例
ラベル → 入力欄 : space-y-2
入力欄 → 入力欄 : space-y-6
セクション間    : mb-10, mt-12
ページパディング: p-6 sm:p-12
```

---

### 9.3 タイポグラフィ

```
// サイズ
ブランドロゴ     : text-xl / text-3xl (lg:)
ページタイトル   : text-xl
ラベル           : text-xs
本文             : text-sm
注釈・補助       : text-xs

// スタイル
tracking-wide    : ロゴ、ボタン、ラベル
tracking-wider   : ブランド名
font-light       : 大きな見出し
leading-relaxed  : 本文
leading-loose    : 詩的な説明文
```

---

### 9.4 入力フォーム

```tsx
// 基本スタイル
<input
  className="
    w-full h-12 px-4
    bg-white
    border border-[#e5e5e5]
    text-[#1a1a1a] text-sm
    placeholder:text-[#d4d4d4]
    focus:outline-none focus:border-[#1a1a1a]
    transition-colors
  "
/>

// ラベル
<label className="block text-xs text-[#737373] tracking-wide">
  メールアドレス
</label>

// 注: 必須マーク（*）は使わない。全フィールド必須が基本。
```

---

### 9.5 ボタン

```tsx
// プライマリボタン
<button
  className="
    w-full h-12
    bg-[#1a1a1a] text-white text-sm tracking-wide
    hover:bg-[#333]
    disabled:bg-[#a3a3a3] disabled:cursor-not-allowed
    transition-colors
  "
>
  ログイン
</button>

// セカンダリボタン（枠線のみ）
<button
  className="
    px-8 py-3
    border border-[#e5e5e5]
    text-[#1a1a1a] text-sm tracking-wide
    hover:bg-[#f5f5f3]
    transition-colors
  "
>
  キャンセル
</button>

// 注: 角丸（rounded）は使わない
```

---

### 9.6 フィードバックメッセージ

```tsx
// エラー（左ボーダーのみ、派手にしない）
<div className="py-3 px-4 bg-[#faf8f8] border-l-2 border-[#c9a0a0]">
  <p className="text-sm text-[#8b6b6b]">{error}</p>
</div>

// 成功
<div className="py-3 px-4 bg-[#f8faf8] border-l-2 border-[#a0c9a0]">
  <p className="text-sm text-[#6b8b6b]">{message}</p>
</div>

// 注: 全面カラー・アイコン・感嘆符は禁止
```

---

### 9.7 アニメーション（Framer Motion）

```tsx
// 基本原則
// - duration は 0.2〜0.3秒
// - ease は "easeInOut" または "easeOut"
// - 派手な動きは禁止

// フェードイン
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>

// スライド + フェード（メッセージ表示など）
<motion.div
  initial={{ opacity: 0, y: -8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
>

// 高さアニメーション（フィールド表示/非表示）
<motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: "auto" }}
  exit={{ opacity: 0, height: 0 }}
  transition={{ duration: 0.2 }}
  className="overflow-hidden"
>

// スライドインジケーター（タブ切り替え）
<motion.div
  initial={false}
  animate={{ left: isActive ? "0%" : "50%", width: "50%" }}
  transition={{ duration: 0.3, ease: "easeInOut" }}
/>

// ローディングスピナー
<motion.span
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  className="inline-block w-4 h-4 border border-white/30 border-t-white rounded-full"
/>
```

---

### 9.8 レイアウトパターン

```tsx
// ページ全体構造
<div className="min-h-screen bg-[#fafaf8] flex flex-col">
  <header>...</header>
  <main className="flex-1">...</main>
  <footer>...</footer>
</div>

// 2カラムレイアウト（デスクトップ）
<main className="flex-1 flex">
  {/* 左: ブランディング・説明 */}
  <div className="hidden lg:flex lg:w-1/2 bg-[#f5f5f3] items-center justify-center p-12">
    ...
  </div>
  {/* 右: メインコンテンツ */}
  <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
    <div className="w-full max-w-sm">
      ...
    </div>
  </div>
</main>

// ヘッダー
<header className="border-b border-[#e5e5e5] bg-white">
  <div className="container mx-auto px-6 h-16 flex items-center">
    <Link href="/" className="text-lg tracking-wider text-[#1a1a1a]">
      SHARE HOUSE
    </Link>
  </div>
</header>

// フッター（軽め）
<footer className="py-6">
  <p className="text-xs text-[#a3a3a3] text-center">Share House Portal</p>
</footer>

// フッター（区切り線あり）
<footer className="border-t border-[#e5e5e5] bg-white">
  <div className="container mx-auto px-6 py-4">
    <p className="text-xs text-[#a3a3a3] text-center">Share House Portal</p>
  </div>
</footer>
```

---

### 9.9 タブ切り替え

```tsx
// アンダーライン方式（推奨）
<div className="relative mb-10">
  <div className="flex">
    <button
      onClick={() => setMode("a")}
      className={`flex-1 py-3 text-sm tracking-wide transition-colors relative z-10 ${
        mode === "a" ? "text-[#1a1a1a]" : "text-[#a3a3a3]"
      }`}
    >
      タブA
    </button>
    <button
      onClick={() => setMode("b")}
      className={`flex-1 py-3 text-sm tracking-wide transition-colors relative z-10 ${
        mode === "b" ? "text-[#1a1a1a]" : "text-[#a3a3a3]"
      }`}
    >
      タブB
    </button>
  </div>
  {/* ベースライン */}
  <div className="absolute bottom-0 left-0 right-0 h-px bg-[#e5e5e5]" />
  {/* アクティブインジケーター */}
  <motion.div
    className="absolute bottom-0 h-px bg-[#1a1a1a]"
    initial={false}
    animate={{
      left: mode === "a" ? "0%" : "50%",
      width: "50%",
    }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  />
</div>
```

---

### 9.10 エラーページ

```tsx
// 構造
<div className="min-h-screen bg-[#fafaf8] flex flex-col">
  <header>...</header>
  <main className="flex-1 flex items-center justify-center p-6">
    <div className="text-center max-w-md">
      <p className="text-6xl text-[#d4d4d4] mb-6 font-light">404</p>
      <h1 className="text-xl text-[#1a1a1a] mb-3 tracking-wide">
        ページが見つかりません
      </h1>
      <p className="text-sm text-[#737373] mb-8 leading-relaxed">
        お探しのページは移動または削除された可能性があります
      </p>
      <Link
        href="/"
        className="inline-block px-8 py-3 bg-[#1a1a1a] text-white text-sm tracking-wide hover:bg-[#333] transition-colors"
      >
        ホームに戻る
      </Link>
    </div>
  </main>
  <footer>...</footer>
</div>

// 文言の原則
// - 数字は大きく薄く（#d4d4d4）
// - 見出しは淡々と
// - 説明は控えめに
// - アイコン・絵文字は禁止
```

---

## 最後に

この DESIGN.md は
「守るための制約」ではなく「迷わないための道具」である。

新しいUI・機能を追加する際は、
足す前に削れないかを必ず検討すること。

### 実装前チェックリスト

- [ ] カラーパレット内の色のみ使用しているか
- [ ] 装飾的な要素（アイコン・グラデーション・影）がないか
- [ ] アニメーションは静かで短いか（0.2〜0.3秒）
- [ ] 余白は十分にあるか
- [ ] 文言は淡々としているか
- [ ] 無印良品のサイトに置いても違和感がないか
