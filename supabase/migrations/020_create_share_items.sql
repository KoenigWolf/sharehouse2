-- ============================================
-- おすそわけボード: テーブル定義
-- ============================================

create table if not exists public.share_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'available' not null check (status in ('available', 'claimed')),
  claimed_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

drop trigger if exists share_items_updated_at on public.share_items;
create trigger share_items_updated_at
  before update on public.share_items
  for each row
  execute function public.handle_updated_at();

create index if not exists share_items_status_expires_idx on public.share_items (status, expires_at);

-- ============================================
-- Row Level Security (RLS) ポリシー
-- ============================================

alter table public.share_items enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'share_items' and policyname = '認証済みユーザーはおすそわけを閲覧可能') then
    create policy "認証済みユーザーはおすそわけを閲覧可能"
      on public.share_items for select to authenticated using (true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'share_items' and policyname = '自分のおすそわけのみ作成可能') then
    create policy "自分のおすそわけのみ作成可能"
      on public.share_items for insert to authenticated with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'share_items' and policyname = 'おすそわけの更新ポリシー') then
    -- 投稿者は自由に更新可。他ユーザーは available のアイテムを claimed に変更可能
    create policy "おすそわけの更新ポリシー"
      on public.share_items for update to authenticated using (auth.uid() = user_id or status = 'available');
  end if;

  if not exists (select 1 from pg_policies where tablename = 'share_items' and policyname = '自分のおすそわけのみ削除可能') then
    create policy "自分のおすそわけのみ削除可能"
      on public.share_items for delete to authenticated using (auth.uid() = user_id);
  end if;
end $$;
