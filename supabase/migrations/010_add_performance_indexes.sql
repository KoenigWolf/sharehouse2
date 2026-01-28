-- ============================================
-- パフォーマンス最適化インデックス
-- クエリパターン分析に基づく戦略的インデックス追加
-- ============================================

-- profiles: admin権限チェック用部分インデックス
-- is_admin()関数がRLSポリシーで頻繁に呼ばれるため
create index if not exists profiles_is_admin_idx
on public.profiles(is_admin)
where is_admin = true;

-- tea_time_settings: 有効参加者フィルタリング用部分インデックス
-- マッチングアルゴリズムで有効ユーザーを検索する際に使用
create index if not exists tea_time_settings_is_enabled_idx
on public.tea_time_settings(is_enabled)
where is_enabled = true;

-- tea_time_matches: ステータス別絞り込み+日時ソート用複合インデックス
-- getLatestScheduledMatch()などのステータス絞り込みクエリ向け
create index if not exists tea_time_matches_status_matched_at_idx
on public.tea_time_matches(status, matched_at desc);

-- garbage_duties: 未完了タスクフィルタリング用部分インデックス
-- ダッシュボードやリマインダーで未完了タスクを表示する際に使用
create index if not exists garbage_duties_is_completed_idx
on public.garbage_duties(is_completed)
where is_completed = false;

-- garbage_duties: ゴミの種類別フィルタリング用インデックス
create index if not exists garbage_duties_garbage_type_idx
on public.garbage_duties(garbage_type);

-- room_photos: ユーザー別+作成日時順の複合インデックス
-- ギャラリー表示でユーザーごとの写真を作成日時順に取得
create index if not exists room_photos_user_id_created_at_idx
on public.room_photos(user_id, created_at desc);

-- profiles: 部屋番号ソート用インデックス
-- 当番ローテーション生成時に部屋番号順でソートする際に使用
create index if not exists profiles_room_number_idx
on public.profiles(room_number);
