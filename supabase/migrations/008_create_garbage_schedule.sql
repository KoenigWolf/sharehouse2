-- ============================================
-- ゴミ出しスケジュール・当番テーブル作成
-- ============================================

-- 曜日別ゴミ収集スケジュール（管理者管理）
create table public.garbage_schedule (
  id uuid default gen_random_uuid() primary key,
  garbage_type text not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  notes text,
  display_order smallint default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create trigger on_garbage_schedule_updated
  before update on public.garbage_schedule
  for each row execute function public.handle_updated_at();

-- ゴミ出し当番（ローテーション）
create table public.garbage_duties (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  duty_date date not null,
  garbage_type text not null,
  is_completed boolean default false not null,
  created_at timestamptz default now() not null
);

create index garbage_duties_user_id_idx on public.garbage_duties(user_id);
create index garbage_duties_date_idx on public.garbage_duties(duty_date);
create unique index garbage_duties_date_type_idx on public.garbage_duties(duty_date, garbage_type);

-- RLS
alter table public.garbage_schedule enable row level security;
alter table public.garbage_duties enable row level security;

-- garbage_schedule ポリシー
create policy "認証済みユーザーはゴミスケジュールを閲覧可能"
  on public.garbage_schedule for select to authenticated using (true);

create policy "管理者のみゴミスケジュールを作成可能"
  on public.garbage_schedule for insert to authenticated
  with check (public.is_admin());

create policy "管理者のみゴミスケジュールを更新可能"
  on public.garbage_schedule for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "管理者のみゴミスケジュールを削除可能"
  on public.garbage_schedule for delete to authenticated
  using (public.is_admin());

-- garbage_duties ポリシー
create policy "認証済みユーザーはゴミ当番を閲覧可能"
  on public.garbage_duties for select to authenticated using (true);

create policy "管理者のみゴミ当番を割り当て可能"
  on public.garbage_duties for insert to authenticated
  with check (public.is_admin());

create policy "自分の当番完了または管理者は更新可能"
  on public.garbage_duties for update to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "管理者のみゴミ当番を削除可能"
  on public.garbage_duties for delete to authenticated
  using (public.is_admin());
