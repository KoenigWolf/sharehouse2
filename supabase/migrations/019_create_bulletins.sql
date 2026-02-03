-- ============================================
-- ひとこと掲示板: テーブル定義
-- ============================================

create table public.bulletins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  message text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create trigger bulletins_updated_at
  before update on public.bulletins
  for each row
  execute function public.handle_updated_at();

-- ============================================
-- Row Level Security (RLS) ポリシー
-- ============================================

alter table public.bulletins enable row level security;

create policy "認証済みユーザーは掲示板を閲覧可能"
  on public.bulletins
  for select
  to authenticated
  using (true);

create policy "自分の掲示板メッセージのみ作成可能"
  on public.bulletins
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "自分の掲示板メッセージのみ更新可能"
  on public.bulletins
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy "自分の掲示板メッセージのみ削除可能"
  on public.bulletins
  for delete
  to authenticated
  using (auth.uid() = user_id);
