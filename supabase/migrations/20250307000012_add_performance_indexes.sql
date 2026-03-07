-- ============================================
-- Share House Portal: Performance Indexes
-- Strategic indexes based on query patterns
-- ============================================

-- profiles: admin権限チェック用部分インデックス
-- is_admin()関数がRLSポリシーで頻繁に呼ばれるため
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx
  ON public.profiles(is_admin)
  WHERE is_admin = true;

-- profiles: 部屋番号ソート用インデックス
-- 当番ローテーション生成時に部屋番号順でソートする際に使用
CREATE INDEX IF NOT EXISTS profiles_room_number_idx
  ON public.profiles(room_number);

-- tea_time_settings: 有効参加者フィルタリング用部分インデックス
-- マッチングアルゴリズムで有効ユーザーを検索する際に使用
CREATE INDEX IF NOT EXISTS tea_time_settings_is_enabled_idx
  ON public.tea_time_settings(is_enabled)
  WHERE is_enabled = true;

-- tea_time_matches: ステータス別絞り込み+日時ソート用複合インデックス
-- getLatestScheduledMatch()などのステータス絞り込みクエリ向け
CREATE INDEX IF NOT EXISTS tea_time_matches_status_matched_at_idx
  ON public.tea_time_matches(status, matched_at DESC);

-- garbage_duties: 未完了タスクフィルタリング用部分インデックス
-- ダッシュボードやリマインダーで未完了タスクを表示する際に使用
CREATE INDEX IF NOT EXISTS garbage_duties_is_completed_idx
  ON public.garbage_duties(is_completed)
  WHERE is_completed = false;

-- garbage_duties: ゴミの種類別フィルタリング用インデックス
CREATE INDEX IF NOT EXISTS garbage_duties_garbage_type_idx
  ON public.garbage_duties(garbage_type);

-- room_photos: ユーザー別+作成日時順の複合インデックス
-- ギャラリー表示でユーザーごとの写真を作成日時順に取得
CREATE INDEX IF NOT EXISTS room_photos_user_id_created_at_idx
  ON public.room_photos(user_id, created_at DESC);
