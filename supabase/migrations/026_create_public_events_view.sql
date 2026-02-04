-- ============================================
-- イベント（Events）公開チラ見せ用ビューの作成
-- ============================================

drop view if exists public.events_public_teaser cascade;
create or replace view public.events_public_teaser
  with (security_invoker = true) as
select
  e.id,
  e.user_id,
  -- NULL でも '...' を返し、フロントで一貫した表示にする
  coalesce(left(e.title, 5), '') || '...' as masked_title,
  coalesce(left(e.description, 10), '') || '...' as masked_description,
  e.event_date,
  e.event_time,
  e.location,
  e.created_at,
  -- 投稿者の公開プロフィール情報
  p.masked_name,
  p.masked_nickname
from public.events e
join public.residents_public_teaser p on e.user_id = p.id;

-- anon ロール（未認証ユーザー）にビューの参照権限を付与
grant select on public.events_public_teaser to anon;
grant select on public.events_public_teaser to authenticated;
