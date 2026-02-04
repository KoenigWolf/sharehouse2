-- ============================================
-- 公開チラ見せビュー群の再構築
-- 既に適用済みの 023 に masked_nickname が含まれていない
-- 環境向けにビューを DROP CASCADE → 再作成する
-- ============================================

-- 依存ビューも含めて安全に削除
drop view if exists public.room_photos_public_teaser cascade;
drop view if exists public.events_public_teaser cascade;
drop view if exists public.share_items_public_teaser cascade;
drop view if exists public.bulletins_public_teaser cascade;
drop view if exists public.residents_public_teaser cascade;

-- ============================================
-- 1. residents_public_teaser（ベースビュー）
-- ============================================
create or replace view public.residents_public_teaser
  with (security_invoker = true) as
select
  id,
  case when coalesce(nullif(name, ''), null) is not null
    then left(name, 1) || '***'
    else '***'
  end as masked_name,
  case when nickname is not null then left(nickname, 1) || '***' else null end as masked_nickname,
  left(bio, 50) as masked_bio,
  age_range,
  occupation,
  industry,
  created_at
from public.profiles;

grant select on public.residents_public_teaser to anon;
grant select on public.residents_public_teaser to authenticated;

-- ============================================
-- 2. bulletins_public_teaser
-- ============================================
create or replace view public.bulletins_public_teaser
  with (security_invoker = true) as
select
  b.id,
  b.user_id,
  left(b.message, 20) as masked_message,
  b.created_at,
  b.updated_at,
  p.masked_name,
  p.masked_nickname
from public.bulletins b
join public.residents_public_teaser p on b.user_id = p.id;

grant select on public.bulletins_public_teaser to anon;
grant select on public.bulletins_public_teaser to authenticated;

-- ============================================
-- 3. share_items_public_teaser
-- ============================================
create or replace view public.share_items_public_teaser
  with (security_invoker = true) as
select
  s.id,
  s.user_id,
  coalesce(left(s.title, 5), '') || '...' as masked_title,
  coalesce(left(s.description, 10), '') || '...' as masked_description,
  s.status,
  s.expires_at,
  s.created_at,
  p.masked_name,
  p.masked_nickname
from public.share_items s
join public.residents_public_teaser p on s.user_id = p.id;

grant select on public.share_items_public_teaser to anon;
grant select on public.share_items_public_teaser to authenticated;

-- ============================================
-- 4. events_public_teaser
-- ============================================
create or replace view public.events_public_teaser
  with (security_invoker = true) as
select
  e.id,
  e.user_id,
  coalesce(left(e.title, 5), '') || '...' as masked_title,
  coalesce(left(e.description, 10), '') || '...' as masked_description,
  e.event_date,
  e.event_time,
  e.location,
  e.created_at,
  p.masked_name,
  p.masked_nickname
from public.events e
join public.residents_public_teaser p on e.user_id = p.id;

grant select on public.events_public_teaser to anon;
grant select on public.events_public_teaser to authenticated;

-- ============================================
-- 5. room_photos_public_teaser
-- ============================================
-- photo_url は公開しない（CSS blur では DevTools で閲覧可能なため）
create or replace view public.room_photos_public_teaser
  with (security_invoker = true) as
select
  rp.id,
  rp.user_id,
  coalesce(left(rp.caption, 5), '') || '...' as masked_caption,
  rp.taken_at,
  rp.created_at,
  p.masked_name,
  p.masked_nickname
from public.room_photos rp
join public.residents_public_teaser p on rp.user_id = p.id;

grant select on public.room_photos_public_teaser to anon;
grant select on public.room_photos_public_teaser to authenticated;
