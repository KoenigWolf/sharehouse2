# Share House Portal

20人規模のシェアハウス住民専用ポータルサイト。「Premium Modern Minimalism」をテーマに、住民同士の交流を促進するための名簿、プロフィール管理、掲示板、イベント、ティータイムなどの機能を提供します。

## 機能概要

### 👥 住民管理
- **住民一覧**: 全住民のプロフィールをグリッド表示。フロア別フィルタ、名前順ソート、検索に対応。
- **フロアマップ**: 2F〜5Fの部屋配置を視覚的に表示し、住民プロフィールへクイックアクセス。
- **プロフィール**: MBTI、趣味、入居日などの人となりがわかる情報の管理。
- **ルームフォト**: 各自の部屋の雰囲気を共有できるギャラリー機能（HEIC対応・自動圧縮）。

### 💬 コミュニケーション
- **掲示板 (Bulletin)**: 住民全員が見られるシンプルなひとこと投稿。
- **イベント (Events)**: ハウス内イベントの企画・参加管理。
- **おすそわけ (Share)**: 余った食材や日用品の譲り合い。
- **ティータイム**: 週1回のランダムマッチング。お茶に誘うきっかけを自動生成。

### 🛠 管理・システム
- **管理者パネル**: 全ユーザーの一覧確認、権限管理、プロフィールの強制編集、アカウント削除。
- **多言語対応**: 日本語 / 英語の完全対応（ブラウザ設定またはCookieによる自動切替）。
- **モバイル最適化**: PWAを意識した快適なモバイルブラウジング、セーフエリア対応。
- **システム品質**: Sentryによるエラー監視、Redisによるレート制限、Web Vitals計測。

## ドキュメント

詳細な設計指針や規約は `docs/` ディレクトリを参照してください。

| ドキュメント | 内容 |
|------------|------|
| [README.md](./README.md) | プロジェクト概要・セットアップ（本ファイル） |
| [CONCEPT.md](./docs/concept.md) | プロダクトビジョン・原則 |
| [DESIGN_GUIDELINES.md](./docs/design-guidelines.md) | Premium Modern Minimalist デザインシステム |
| [CODING_GUIDELINES.md](./docs/coding-guidelines.md) | コーディング規約・品質基準 |
| [IMPROVEMENTS.md](./docs/improvements.md) | 改善履歴・技術的負債・ロードマップ |

## 技術スタック

- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19
- **Styling**: Tailwind CSS 4 + Framer Motion (Premium Animations)
- **UI Components**: shadcn/ui + Radix UI
- **Backend**: Supabase (Auth, DB, RLS, Storage)
- **Infrastructure**: Vercel + Upstash (Redis for Rate Limiting)
- **Monitoring**: Sentry + Web Vitals

## セットアップ

### 1. リポジトリのクローンとインストール
```bash
git clone <repository-url>
cd sharehouse2
npm install
```

### 2. 環境変数の設定
`.env.local` を作成し、SupabaseとUpstashの情報を設定してください。
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
# Sentry DSN 等のオプション設定
```

### 3. Supabaseの初期化
`supabase/migrations` にあるSQLファイルを順番に適用、または `supabase db push` を使用してスキーマを同期してください。

### 4. 起動
```bash
npm run dev
```

## プロジェクト構成

```
src/
├── app/            # ページルーティング（Next.js App Router）
├── components/     # 再利用可能なUIコンポーネント
│   └── ui/         # shadcn/ui ベースのプリミティブ
├── domain/         # ドメイン型・バリデーション (Zod)
├── hooks/          # UI・ロジック用カスタムフック
├── lib/            # ビジネスロジック・サーバーアクション
│   ├── admin/      # 管理者機能
│   ├── auth/       # 認証処理
│   ├── i18n/       # 多言語翻訳データ
│   └── supabase/   # Supabaseクライアント・設定
└── __tests__/      # 単体・統合テスト（Vitest）
```

## 主要なコマンド

- `npm run dev`: 開発サーバー起動
- `npm run check-all`: Lint + 型チェック + テスト + ビルド（推奨コミット前実行）
- `npm run test:run`: 全テストの一括実行
- `npm run lint:fix`: ESLintによる自動修正

## ライセンス

Private / Proprietary
