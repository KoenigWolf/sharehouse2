-- ============================================
-- 各ユーザーの最新投稿のみを返すビュー
-- DISTINCT ON で DB 側で重複排除を行う
-- ============================================

create or replace view public.latest_bulletins_per_user
with (security_invoker = true) as
select distinct on (user_id)
  id,
  user_id,
  message,
  created_at,
  updated_at
from public.bulletins
order by user_id, created_at desc;

-- security_invoker = true により、ビューは呼び出し元ユーザーの権限で実行され、
-- bulletins テーブルの RLS ポリシーが適用される
