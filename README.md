# Share House Portal

20人規模のシェアハウス住民専用ポータルサイト。住民同士の交流を促進するための住民名簿・プロフィール管理・ランダムマッチング機能を提供します。

## 機能

### 住民一覧
- 全住民のプロフィールカードをグリッド表示
- 部屋番号・名前順でソート可能
- 未登録の部屋にはサンプルデータを表示
 - 日本語 / 英語の表示切り替えに対応（Accept-Language / Cookie）

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
- LINEログイン（Supabase OAuth）

## ドキュメント構成

このプロジェクトには、以下のドキュメントが用意されています:

| ドキュメント | 目的 | 参照タイミング |
|------------|------|--------------|
| [README.md](./README.md) | プロジェクト概要・セットアップ手順 | 初回セットアップ時 |
| [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) | コーディング規約・ベストプラクティス | コード作成・修正時（必須） |
| [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md) | デザイン思想・UI/UX・実装パターン | 新規ページ・機能実装時（必須） |
| [IMPROVEMENTS.md](./IMPROVEMENTS.md) | 改善項目・技術的負債の管理 | リファクタリング・機能拡張時 |

**Claude Code への注意:**
- コード作成時は **CODING_GUIDELINES.md** を必ず参照すること
- UI実装時は **DESIGN_GUIDELINES.md** を必ず参照すること
- これらのガイドラインは「制約」ではなく「迷わないための道具」です

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
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

`NEXT_PUBLIC_SITE_URL` はサーバーアクションのオリジン検証に使用します（ローカルは `http://localhost:3000` が許可済み）。

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

## LINEログイン設定

Supabase Dashboard > Authentication > Providers で LINE を有効化し、
LINE Developers で発行した Client ID / Client Secret を登録してください。

**Redirect URLs に追加する値:**
- `https://your-app.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback`

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
├── domain/                # ドメイン層（型・バリデーション）
├── application/           # アプリケーション層（ユースケース補助）
├── lib/
│   ├── supabase/          # Supabaseクライアント
│   ├── auth/actions.ts    # 認証アクション
│   ├── profile/actions.ts # プロフィールアクション
│   ├── tea-time/actions.ts # ティータイムアクション
│   └── mock-data.ts       # サンプルデータ
└── hooks/                 # UI用カスタムフック
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

# 型チェック
npm run type-check

# テスト実行
npm run test:run

# Lint + TypeScript + Test + Build
npm run check-all
```

## ビルド時の注意

`next/font` が Google Fonts を取得するため、ビルド時にネットワークアクセスが必要です。オフライン環境では `npm run build` が失敗します。

## コーディングガイドライン

開発者必読: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)

このプロジェクトでは、リーダブルコードの原則に基づいたコーディング規約を採用しています。
コード作成・修正時は必ずガイドラインに従ってください。

主な原則:
- コメントではなく、コード自体で説明する
- 明確な命名により、コメントを不要にする
- コメントは「なぜ（WHY）」を説明し、「何を（WHAT）」は説明しない
- 単一責任の原則に従う
- 早期リターン（ガード節）を使用する

詳細は [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) を参照してください。

## デザインガイドライン

開発者必読: [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md)

無印良品にインスパイアされたミニマルデザインを採用しています。
新規ページや機能の実装時は必ずガイドラインを確認してください。

主な原則:
- デザインは主張しない（環境として機能する）
- 理由のない装飾は禁止
- 低彩度・最小限のアクセントカラー
- 余白は情報整理のために使う
- アニメーションは静かに、短く（0.2〜0.3秒）

詳細（カラーパレット・コンポーネント・実装例）は [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md) を参照してください。

## ライセンス

Private
