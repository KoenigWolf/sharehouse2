# Share House Portal

20人規模のシェアハウス住民専用ポータルサイト。住民同士の交流を促進するための住民名簿・プロフィール管理・ランダムマッチング機能を提供します。

## 機能

### 住民一覧
- 全住民のプロフィールカードをグリッド表示
- 部屋番号・名前順でソート可能
- 未登録の部屋にはサンプルデータを表示

### プロフィール管理
- 名前、部屋番号、自己紹介、趣味・関心、入居日を編集
- プロフィール写真のアップロード（JPG/PNG/WebP、5MB以下）
- プロフィール完成度の表示

### ティータイム（ランダムマッチング）
- 参加をON/OFFで切り替え可能
- 参加者同士をランダムにマッチング
- マッチ履歴の確認、完了/スキップの記録

### 認証
- メールアドレス・パスワードでの新規登録・ログイン
- メール確認による本人認証

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS 4
- **UIコンポーネント**: shadcn/ui + Radix UI
- **バックエンド**: Supabase (認証・データベース・ストレージ)
- **デプロイ**: Vercel

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd sharehouse2
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) でアカウント作成
2. 新しいプロジェクトを作成
3. Project Settings > API から以下の情報を取得:
   - Project URL
   - anon public key

### 4. 環境変数の設定

`.env.local` ファイルを作成:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. データベースのセットアップ

Supabase SQL Editor で以下のSQLを順番に実行:

#### プロフィールテーブル

```sql
-- プロフィールテーブル作成
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  room_number text,
  bio text,
  avatar_url text,
  interests text[] DEFAULT '{}',
  move_in_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ポリシー設定
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);
```

#### ティータイムテーブル

```sql
-- ティータイム設定テーブル
CREATE TABLE public.tea_time_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT false NOT NULL,
  preferred_time text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.tea_time_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all tea time settings"
  ON public.tea_time_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own settings"
  ON public.tea_time_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.tea_time_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- マッチテーブル
CREATE TABLE public.tea_time_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_at timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'done', 'skipped')),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.tea_time_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches"
  ON public.tea_time_matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own matches"
  ON public.tea_time_matches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);
```

#### ストレージバケット

Supabase Dashboard > Storage で「avatars」バケットを作成（Public bucket: ON）後、SQL Editorで実行:

```sql
-- ストレージポリシー
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

## Vercelへのデプロイ

### 1. Vercelアカウントの準備

[Vercel](https://vercel.com) でアカウントを作成し、GitHubと連携

### 2. プロジェクトのインポート

1. Vercel Dashboard で「Add New Project」をクリック
2. GitHubリポジトリを選択
3. 「Import」をクリック

### 3. 環境変数の設定

Project Settings > Environment Variables で以下を追加:

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | SupabaseのProject URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabaseのanon key |

### 4. デプロイ

「Deploy」ボタンをクリック。以降はmainブランチへのpushで自動デプロイされます。

### 5. Supabaseの設定更新

デプロイ完了後、Supabase Dashboard で以下を設定:

**Authentication > URL Configuration:**
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/**`

## プロジェクト構成

```
src/
├── app/                    # ページ（App Router）
│   ├── page.tsx           # ホーム（住民一覧）
│   ├── login/             # ログイン・新規登録
│   ├── profile/[id]/      # プロフィール詳細
│   │   └── edit/          # プロフィール編集
│   ├── settings/          # マイページ
│   └── tea-time/          # ティータイム
├── components/
│   ├── ui/                # shadcn/ui コンポーネント
│   ├── header.tsx         # ヘッダー
│   ├── residents-grid.tsx # 住民グリッド
│   ├── resident-card.tsx  # 住民カード
│   ├── profile-detail.tsx # プロフィール詳細
│   ├── profile-edit-form.tsx # プロフィール編集フォーム
│   └── tea-time-*.tsx     # ティータイム関連
├── lib/
│   ├── supabase/          # Supabaseクライアント
│   ├── auth/actions.ts    # 認証アクション
│   ├── profile/actions.ts # プロフィールアクション
│   ├── tea-time/actions.ts # ティータイムアクション
│   └── mock-data.ts       # サンプルデータ
└── types/                 # 型定義
```

## ページ一覧

| パス | 説明 | 認証 |
|------|------|------|
| `/login` | ログイン・新規登録 | 不要 |
| `/` | 住民一覧（ホーム） | 必要 |
| `/profile/[id]` | プロフィール詳細 | 必要 |
| `/profile/[id]/edit` | プロフィール編集 | 必要（本人のみ） |
| `/settings` | マイページ | 必要 |
| `/tea-time` | ティータイム | 必要 |

## テストアカウント

ログインページの「テストアカウント」ボタンで以下が自動入力されます:

- メール: `test@example.com`
- パスワード: `password123`

※ 使用するには事前にこのアカウントを登録してください

## コマンド一覧

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# Lint実行
npm run lint
```

## デザインガイドライン

無印良品にインスパイアされたミニマルデザイン:

| 要素 | 値 |
|------|-----|
| アクセントカラー | `#b94a48`（テラコッタ） |
| 背景色 | `#fafaf8`（オフホワイト） |
| テキスト | `#1a1a1a`（ダークグレー） |
| ボーダー | `#e5e5e5`（ライトグレー） |
| 角丸 | なし（`rounded-none`） |

## ライセンス

Private
