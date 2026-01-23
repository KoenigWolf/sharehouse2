-- ============================================
-- ティータイム機能: テーブル定義
-- ============================================

-- ティータイム参加設定テーブル
create table public.tea_time_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  is_enabled boolean default false not null,
  preferred_time text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- updated_at 自動更新トリガー
create trigger on_tea_time_settings_updated
  before update on public.tea_time_settings
  for each row
  execute function public.handle_updated_at();

-- ティータイムマッチ履歴テーブル
create table public.tea_time_matches (
  id uuid default gen_random_uuid() primary key,
  user1_id uuid references auth.users(id) on delete cascade not null,
  user2_id uuid references auth.users(id) on delete cascade not null,
  matched_at timestamptz default now() not null,
  status text default 'scheduled' not null check (status in ('scheduled', 'done', 'skipped')),
  created_at timestamptz default now() not null
);

-- マッチ検索用インデックス
create index tea_time_matches_user1_idx on public.tea_time_matches(user1_id);
create index tea_time_matches_user2_idx on public.tea_time_matches(user2_id);
create index tea_time_matches_matched_at_idx on public.tea_time_matches(matched_at desc);

-- ============================================
-- Row Level Security (RLS) ポリシー
-- ============================================

-- tea_time_settings
alter table public.tea_time_settings enable row level security;

-- 認証済みユーザーは全員の参加状態を閲覧可能（マッチング処理用）
create policy "認証済みユーザーは参加設定を閲覧可能"
  on public.tea_time_settings
  for select
  to authenticated
  using (true);

-- 自分の設定のみ作成可能
create policy "自分の参加設定のみ作成可能"
  on public.tea_time_settings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 自分の設定のみ更新可能
create policy "自分の参加設定のみ更新可能"
  on public.tea_time_settings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- tea_time_matches
alter table public.tea_time_matches enable row level security;

-- 自分が関わるマッチのみ閲覧可能
create policy "自分のマッチのみ閲覧可能"
  on public.tea_time_matches
  for select
  to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- マッチの作成はサーバー側（service_role）のみ許可
-- クライアントからの直接INSERTは禁止

-- 自分が関わるマッチのステータスのみ更新可能
create policy "自分のマッチステータスのみ更新可能"
  on public.tea_time_matches
  for update
  to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);
