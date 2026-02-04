-- ============================================
-- 公開チラ見せ用ビューの作成
-- ============================================

-- public.profiles から一部の情報をマスクして返すビュー
create or replace view public.residents_public_teaser as
select
  id,
  -- 名前の一文字目以外を伏せ字にする
  left(name, 1) || '***' as masked_name,
  nickname,
  -- 自己紹介の冒頭50文字のみ
  left(bio, 50) as masked_bio,
  avatar_url,
  age_range,
  occupation,
  industry,
  created_at
from public.profiles;

-- anon ロール（未認証ユーザー）にビューの参照権限を付与
grant select on public.residents_public_teaser to anon;
grant select on public.residents_public_teaser to authenticated;

-- Storage のアバター画像を未認証ユーザーでも（一応）見れるようにする
-- (UI側でぼかしを入れるが、画像自体が 403 だと何も表示されないため)
create policy "アバター画像は未認証ユーザーでも閲覧可能"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'avatars');
