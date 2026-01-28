-- ============================================
-- プッシュ通知サブスクリプションテーブル作成
-- ============================================

create table public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz default now() not null
);

create index push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

create policy "自分のプッシュ購読のみ閲覧可能"
  on public.push_subscriptions for select to authenticated
  using (auth.uid() = user_id);

create policy "自分のプッシュ購読のみ作成可能"
  on public.push_subscriptions for insert to authenticated
  with check (auth.uid() = user_id);

create policy "自分のプッシュ購読のみ削除可能"
  on public.push_subscriptions for delete to authenticated
  using (auth.uid() = user_id);
