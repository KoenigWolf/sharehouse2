-- ============================================
-- events と share_items に profiles への外部キー関係を追加
-- PostgREST が自動的にリレーションを検出できるようにする
-- ============================================

-- events.user_id から profiles.id への外部キー追加
-- profiles.id は auth.users(id) を参照しているため、同じ UUID を共有
alter table public.events
  add constraint events_user_id_profiles_fk
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;

-- event_attendees.user_id から profiles.id への外部キー追加
alter table public.event_attendees
  add constraint event_attendees_user_id_profiles_fk
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;

-- share_items.user_id から profiles.id への外部キー追加
alter table public.share_items
  add constraint share_items_user_id_profiles_fk
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;

-- share_items.claimed_by から profiles.id への外部キー追加
-- claimed_by は nullable なので、SET NULL のまま維持
alter table public.share_items
  add constraint share_items_claimed_by_profiles_fk
  foreign key (claimed_by)
  references public.profiles(id)
  on delete set null;
