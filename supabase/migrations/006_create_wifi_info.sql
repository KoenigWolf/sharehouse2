-- ============================================
-- Wi-Fi 情報テーブル作成
-- ============================================

create table public.wifi_info (
  id uuid default gen_random_uuid() primary key,
  area_name text not null,
  ssid text not null,
  password text not null,
  display_order smallint default 0 not null,
  updated_by uuid references auth.users(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create trigger on_wifi_info_updated
  before update on public.wifi_info
  for each row execute function public.handle_updated_at();

alter table public.wifi_info enable row level security;

create policy "認証済みユーザーはWi-Fi情報を閲覧可能"
  on public.wifi_info for select to authenticated using (true);

create policy "管理者のみWi-Fi情報を作成可能"
  on public.wifi_info for insert to authenticated
  with check (public.is_admin());

create policy "管理者のみWi-Fi情報を更新可能"
  on public.wifi_info for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "管理者のみWi-Fi情報を削除可能"
  on public.wifi_info for delete to authenticated
  using (public.is_admin());
