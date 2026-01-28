-- ============================================
-- 文京区白山エリア ゴミ出しスケジュール初期データ
-- 令和7年4月改訂版に基づく
-- ============================================

-- 既存データをクリアして最新情報に置き換え
delete from public.garbage_schedule;

-- 月曜: 資源プラスチック（令和7年4月〜新設）
insert into public.garbage_schedule (garbage_type, day_of_week, notes, display_order)
values ('資源プラスチック', 1, '朝8時までに集積所へ', 0);

-- 水曜: 可燃ごみ
insert into public.garbage_schedule (garbage_type, day_of_week, notes, display_order)
values ('可燃ごみ', 3, '朝8時までに集積所へ', 0);

-- 木曜: 資源（新聞・雑誌・雑がみ・段ボール・びん・缶・ペットボトル）
insert into public.garbage_schedule (garbage_type, day_of_week, notes, display_order)
values ('資源', 4, '新聞・雑誌・雑がみ・段ボール・びん・缶・ペットボトル／朝8時までに集積所へ', 0);

-- 金曜: 不燃ごみ（第1・第3のみ）
insert into public.garbage_schedule (garbage_type, day_of_week, notes, display_order)
values ('不燃ごみ', 5, '第1・第3金曜日のみ／朝8時までに集積所へ', 0);

-- 土曜: 可燃ごみ
insert into public.garbage_schedule (garbage_type, day_of_week, notes, display_order)
values ('可燃ごみ', 6, '朝8時までに集積所へ', 0);
