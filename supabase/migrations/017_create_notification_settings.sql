-- ============================================
-- 通知設定テーブル
-- ============================================

create table public.notification_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  notify_tea_time boolean default true not null,
  notify_garbage_duty boolean default true not null,
  notify_new_photos boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create trigger on_notification_settings_updated
  before update on public.notification_settings
  for each row
  execute function public.handle_updated_at();

alter table public.notification_settings enable row level security;

create policy "ユーザーは自分の通知設定を閲覧可能"
  on public.notification_settings for select to authenticated
  using (auth.uid() = user_id);

create policy "ユーザーは自分の通知設定を作成可能"
  on public.notification_settings for insert to authenticated
  with check (auth.uid() = user_id);

create policy "ユーザーは自分の通知設定を更新可能"
  on public.notification_settings for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
