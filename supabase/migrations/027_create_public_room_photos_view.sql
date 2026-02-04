-- ============================================
-- 部屋の写真（Room Photos）公開チラ見せ用ビューの作成
-- ============================================

drop view if exists public.room_photos_public_teaser cascade;
create or replace view public.room_photos_public_teaser as
select
  rp.id,
  rp.user_id,
  rp.photo_url,
  -- キャプションの一部のみ表示（NULL 安全）
  case when rp.caption is not null then left(rp.caption, 5) || '...' else null end as masked_caption,
  rp.taken_at,
  rp.created_at,
  -- 投稿者の公開プロフィール情報
  p.masked_name,
  p.masked_nickname
from public.room_photos rp
join public.residents_public_teaser p on rp.user_id = p.id;

-- anon ロール（未認証ユーザー）にビューの参照権限を付与
grant select on public.room_photos_public_teaser to anon;
grant select on public.room_photos_public_teaser to authenticated;
