-- ============================================
-- イベントカレンダー: テーブル定義
-- ============================================

create table public.events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  event_date date not null,
  event_time text,
  location text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create trigger events_updated_at
  before update on public.events
  for each row
  execute function public.handle_updated_at();

create index events_date_idx on public.events (event_date);

-- 参加者テーブル
create table public.event_attendees (
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (event_id, user_id)
);

-- ============================================
-- Row Level Security (RLS) ポリシー
-- ============================================

-- events
alter table public.events enable row level security;

create policy "認証済みユーザーはイベントを閲覧可能"
  on public.events
  for select
  to authenticated
  using (true);

create policy "自分のイベントのみ作成可能"
  on public.events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "自分のイベントのみ更新可能"
  on public.events
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy "自分のイベントのみ削除可能"
  on public.events
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- event_attendees
alter table public.event_attendees enable row level security;

create policy "認証済みユーザーは参加者を閲覧可能"
  on public.event_attendees
  for select
  to authenticated
  using (true);

create policy "自分の参加登録のみ作成可能"
  on public.event_attendees
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "自分の参加登録のみ削除可能"
  on public.event_attendees
  for delete
  to authenticated
  using (auth.uid() = user_id);
