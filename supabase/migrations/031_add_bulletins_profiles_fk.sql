-- ============================================
-- bulletins と profiles の外部キー関係を追加
-- PostgREST が自動的にリレーションを検出できるようにする
-- ============================================

-- bulletins.user_id から profiles.id への外部キー追加
-- profiles.id は auth.users(id) を参照しているため、同じ UUID を共有
alter table public.bulletins
  add constraint bulletins_user_id_profiles_fk
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;
