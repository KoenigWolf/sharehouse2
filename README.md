# Share House Portal

20人規模のシェアハウス住民専用ポータル。Web版とネイティブモバイルアプリで、住民同士の交流を促進します。

## 機能概要

### 👥 住民管理
- **住民一覧**: 全住民のプロフィールをグリッド表示。フロア別フィルタ、名前順ソート、検索に対応。
- **フロアマップ**: 2F〜5Fの部屋配置を視覚的に表示し、住民プロフィールへクイックアクセス。
- **プロフィール**: MBTI、趣味、入居日などの人となりがわかる情報の管理。
- **ルームフォト**: Instagram水準のUIで部屋の雰囲気を共有できるギャラリー機能。

### 💬 コミュニケーション
- **掲示板 (Bulletin)**: 住民全員が見られるシンプルなひとこと投稿。
- **イベント (Events)**: ハウス内イベントの企画・参加管理。
- **Share**: 余った食材や日用品の譲り合い。
- **ティータイム**: 週1回のランダムマッチング。お茶に誘うきっかけを自動生成。

### 🛠 管理・システム
- **管理者パネル**: 全ユーザーの一覧確認、権限管理、プロフィールの強制編集、アカウント削除。
- **多言語対応**: 日本語 / 英語の完全対応。
- **プッシュ通知**: 新着イベント・掲示板投稿の通知（モバイルアプリ）。

---

## 📱 モバイルアプリ (iOS / Android)

React Native + Expo で構築したネイティブアプリ。Instagram レベルの品質を目指しています。

### 特徴

| 機能 | 実装 |
|------|------|
| **60fps アニメーション** | Reanimated 3 + スプリング物理演算 |
| **ハプティクス** | タップ・スワイプ時の触覚フィードバック |
| **画像最適化** | expo-image (100MB キャッシュ、BlurHash) |
| **ネイティブジェスチャー** | Gesture Handler |
| **セキュア認証** | SecureStore でトークン保存 |
| **リアルタイム更新** | Supabase サブスクリプション |

### モバイルアプリのセットアップ

```bash
cd mobile

# 環境変数を設定
cp .env.local.example .env.local
# EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_ANON_KEY を編集

# 依存関係をインストール
npm install

# 開発サーバー起動
npm start

# iOS シミュレータで起動
npm run ios

# Android エミュレータで起動
npm run android
```

### モバイルアプリの構成

```
mobile/
├── app/                    # Expo Router (ファイルベースルーティング)
│   ├── (auth)/            # 認証画面 (login)
│   ├── (tabs)/            # メインタブ (residents, bulletin, events, share, settings)
│   └── profile/[id].tsx   # プロフィール詳細
├── components/ui/         # UIコンポーネント (Avatar, Button, Card)
├── lib/                   # Supabase クライアント、認証、ユーティリティ
└── constants/             # デザイントークン（カラー、スペーシング）
```

---

## 🌐 Web アプリ

Next.js 16 (App Router) で構築したWebアプリ。

### 技術スタック

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS 4 + Framer Motion
- **UI Components**: shadcn/ui + Radix UI
- **Backend**: Supabase (Auth, DB, RLS, Storage)
- **Infrastructure**: Vercel + Upstash (Redis)
- **Monitoring**: Sentry + Web Vitals

### Web アプリのセットアップ

```bash
# リポジトリのクローンとインストール
git clone <repository-url>
cd sharehouse2
npm install

# 環境変数を設定
cp .env.local.example .env.local
# Supabase と Upstash の情報を設定

# Supabase マイグレーション適用
# supabase/migrations のSQLを順番に適用

# 開発サーバー起動
npm run dev
```

### Web アプリの構成

```
src/
├── app/            # ページルーティング（Next.js App Router）
├── components/     # 再利用可能なUIコンポーネント
├── domain/         # ドメイン型・バリデーション (Zod)
├── hooks/          # カスタムフック
├── lib/            # ビジネスロジック・サーバーアクション
└── __tests__/      # 単体・統合テスト（Vitest）
```

---

## ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [CONCEPT.md](./docs/concept.md) | プロダクトビジョン・原則 |
| [DESIGN_GUIDELINES.md](./docs/design-guidelines.md) | デザインシステム |
| [CODING_GUIDELINES.md](./docs/coding-guidelines.md) | コーディング規約 |
| [IMPROVEMENTS.md](./docs/improvements.md) | 改善履歴・ロードマップ |

## 主要なコマンド

### Web
- `npm run dev` - 開発サーバー起動
- `npm run check-all` - Lint + 型チェック + テスト + ビルド
- `npm run test:run` - 全テストの一括実行

### Mobile
- `cd mobile && npm start` - Expo 開発サーバー起動
- `cd mobile && npm run ios` - iOS シミュレータで起動
- `cd mobile && npm run android` - Android エミュレータで起動

## ライセンス

Private / Proprietary
