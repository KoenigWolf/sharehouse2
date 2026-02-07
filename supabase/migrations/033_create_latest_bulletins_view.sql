-- ============================================
-- 各ユーザーの最新投稿のみを返すビュー
-- DISTINCT ON で DB 側で重複排除を行う
-- ============================================

create or replace view public.latest_bulletins_per_user as
select distinct on (user_id)
  id,
  user_id,
  message,
  created_at,
  updated_at
from public.bulletins
order by user_id, created_at desc;

-- RLS: 元テーブルの RLS が適用されるため、ビューには追加設定不要
-- ビューは bulletins テーブルの RLS ポリシーを継承する
