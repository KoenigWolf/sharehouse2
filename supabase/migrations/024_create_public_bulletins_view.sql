-- ============================================
-- 掲示板（Bulletins）公開チラ見せ用ビューの作成
-- ============================================

drop view if exists public.bulletins_public_teaser cascade;
create or replace view public.bulletins_public_teaser as
select
  b.id,
  b.user_id,
  -- メッセージの冒頭のみ表示、残りは伏せ字またはUIでぼかす前提
  left(b.message, 20) as masked_message,
  b.created_at,
  b.updated_at,
  -- 投稿者の公開プロフィール情報
  p.masked_name,
  p.masked_nickname
from public.bulletins b
join public.residents_public_teaser p on b.user_id = p.id;

-- anon ロール（未認証ユーザー）にビューの参照権限を付与
grant select on public.bulletins_public_teaser to anon;
grant select on public.bulletins_public_teaser to authenticated;
