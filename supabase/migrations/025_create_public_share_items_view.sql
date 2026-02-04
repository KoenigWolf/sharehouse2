-- ============================================
-- おすそわけ（Share Items）公開チラ見せ用ビューの作成
-- ============================================

drop view if exists public.share_items_public_teaser cascade;
create or replace view public.share_items_public_teaser as
select
  s.id,
  s.user_id,
  -- タイトルの一部と説明をマスク（NULL 安全）
  case when s.title is not null then left(s.title, 5) || '...' else null end as masked_title,
  case when s.description is not null then left(s.description, 10) || '...' else null end as masked_description,
  s.status,
  s.expires_at,
  s.created_at,
  -- 投稿者の公開プロフィール情報
  p.masked_name,
  p.masked_nickname
from public.share_items s
join public.residents_public_teaser p on s.user_id = p.id;

-- anon ロール（未認証ユーザー）にビューの参照権限を付与
grant select on public.share_items_public_teaser to anon;
grant select on public.share_items_public_teaser to authenticated;
