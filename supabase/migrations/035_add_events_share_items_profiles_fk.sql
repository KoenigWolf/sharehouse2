-- ============================================
-- events と share_items の削除動作を改善
-- ユーザー削除時: イベント/Shareアイテムは残す、参加記録は削除
-- PostgREST が自動的にリレーションを検出できるようにする
-- ============================================

-- ============================================
-- 1. events テーブル: ユーザー削除時にイベントを残す
-- ============================================

-- NOT NULL 制約を削除（ユーザー削除後も行を保持するため）
alter table public.events
  alter column user_id drop not null;

-- 既存の FK を削除
alter table public.events
  drop constraint if exists events_user_id_fkey;
alter table public.events
  drop constraint if exists events_user_id_profiles_fk;

-- auth.users への FK を SET NULL で再作成
alter table public.events
  add constraint events_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete set null;

-- profiles への FK を追加（PostgREST 用、SET NULL）
alter table public.events
  add constraint events_user_id_profiles_fk
  foreign key (user_id)
  references public.profiles(id)
  on delete set null;

-- ============================================
-- 2. event_attendees テーブル: ユーザー削除時に参加記録を削除
-- ============================================

-- 既存の FK を削除
alter table public.event_attendees
  drop constraint if exists event_attendees_user_id_fkey;
alter table public.event_attendees
  drop constraint if exists event_attendees_user_id_profiles_fk;

-- auth.users への FK を CASCADE で再作成
alter table public.event_attendees
  add constraint event_attendees_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

-- profiles への FK を追加（PostgREST 用、CASCADE）
alter table public.event_attendees
  add constraint event_attendees_user_id_profiles_fk
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;

-- ============================================
-- 3. share_items テーブル: ユーザー削除時にアイテムを残す
-- ============================================

-- NOT NULL 制約を削除（ユーザー削除後も行を保持するため）
alter table public.share_items
  alter column user_id drop not null;

-- 既存の FK を削除
alter table public.share_items
  drop constraint if exists share_items_user_id_fkey;
alter table public.share_items
  drop constraint if exists share_items_user_id_profiles_fk;
alter table public.share_items
  drop constraint if exists share_items_claimed_by_profiles_fk;

-- auth.users への FK を SET NULL で再作成
alter table public.share_items
  add constraint share_items_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete set null;

-- profiles への FK を追加（PostgREST 用、SET NULL）
alter table public.share_items
  add constraint share_items_user_id_profiles_fk
  foreign key (user_id)
  references public.profiles(id)
  on delete set null;

-- claimed_by の profiles への FK を追加（SET NULL）
alter table public.share_items
  add constraint share_items_claimed_by_profiles_fk
  foreign key (claimed_by)
  references public.profiles(id)
  on delete set null;
