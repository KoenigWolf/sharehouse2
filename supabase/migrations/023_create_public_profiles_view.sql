-- ============================================
-- 公開チラ見せ用ビューの作成
-- ============================================

-- public.profiles から一部の情報をマスクして返すビュー
-- セキュリティ: avatar_url は返さない（CSS blur は DevTools で解除可能なため）
create or replace view public.residents_public_teaser as
select
  id,
  -- 名前の一文字目以外を伏せ字にする
  left(name, 1) || '***' as masked_name,
  -- ニックネームも先頭1文字のみ
  case when nickname is not null then left(nickname, 1) || '***' else null end as masked_nickname,
  -- 自己紹介の冒頭50文字のみ
  left(bio, 50) as masked_bio,
  age_range,
  occupation,
  industry,
  created_at
from public.profiles;

-- anon ロール（未認証ユーザー）にビューの参照権限を付与
grant select on public.residents_public_teaser to anon;
grant select on public.residents_public_teaser to authenticated;
