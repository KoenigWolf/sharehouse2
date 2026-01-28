-- ============================================
-- 管理者ロール追加
-- ============================================

-- profiles テーブルに is_admin カラムを追加
alter table public.profiles
  add column if not exists is_admin boolean default false not null;

-- RLS ポリシー用の管理者チェックヘルパー関数
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
end;
$$ language plpgsql security definer stable;

-- updated_at 自動更新トリガー関数（他テーブルでも共用）
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
