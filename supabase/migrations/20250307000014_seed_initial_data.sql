-- ============================================
-- Share House Portal: Initial Seed Data
-- Garbage schedule, Wi-Fi info, shared info
-- Source: https://www.city.bunkyo.lg.jp/b039/p000926/
-- ============================================

-- ============================================
-- 1. Garbage Schedule (Bunkyo-ku Hakusan 3-chome)
-- ============================================

DELETE FROM public.garbage_schedule;

INSERT INTO public.garbage_schedule (garbage_type, day_of_week, notes, display_order)
VALUES
  ('資源', 1, '新聞・雑誌・段ボール・びん・缶・ペットボトル／朝8時までに集積所へ', 1),
  ('可燃ごみ', 3, '朝8時までに集積所へ', 2),
  ('資源プラスチック', 4, '朝8時までに集積所へ', 3),
  ('不燃ごみ', 5, '第1・第3金曜日のみ／朝8時までに集積所へ', 4),
  ('可燃ごみ', 6, '朝8時までに集積所へ', 5);

-- ============================================
-- 2. Wi-Fi Information (5F)
-- ============================================

DELETE FROM public.wifi_info;

INSERT INTO public.wifi_info (floor, area_name, ssid, password, display_order)
VALUES
  (5, '2.4GHz', 'Yamamomo-1', 'Koishikawa190808', 1),
  (5, '2.4GHz', 'Yamamomo-2', 'Koishikawa190808', 2),
  (5, '5GHz', 'Yamamomo-3', 'Koishikawa190808', 3);

-- ============================================
-- 3. Shared Information
-- ============================================

DELETE FROM public.shared_info;

-- 5F Information
INSERT INTO public.shared_info (info_key, title, content, notes, display_order, floor)
VALUES
  ('mailbox_code', '郵便受け', '左へ2回 4 右へ8', '「448」で覚えてください', 1, 5),
  ('address', '住所', '東京都文京区白山3丁目3番4号 田中ビル', NULL, 2, 5);

-- 2F Information (sample)
INSERT INTO public.shared_info (info_key, title, content, notes, display_order, floor)
VALUES
  ('mailbox_code_2f', '郵便受け', '左に2回「4」、右に1回「8」', '「248」で覚えてください', 1, 2),
  ('address_2f', '住所', '東京都文京区白山3丁目3番4号 田中ビル', NULL, 2, 2)
ON CONFLICT (info_key) DO NOTHING;

-- Building-wide information (floor = 0)
INSERT INTO public.shared_info (info_key, title, content, notes, display_order, floor)
VALUES
  ('building_entrance', 'エントランス', '【要設定】管理画面から実際の暗証番号を入力してください', '夜間（22:00〜7:00）はオートロック', 1, 0),
  ('building_garbage', 'ゴミ集積所', '1Fエントランス横', '収集日の朝8時までに出してください', 2, 0)
ON CONFLICT (info_key) DO NOTHING;

-- Wi-Fi usage notes (floor = NULL for all floors)
INSERT INTO public.shared_info (info_key, title, content, notes, display_order, floor)
VALUES (
  'wifi_note',
  'Wi-Fi利用上の注意',
  'Wi-Fiの名前（SSID）は非公開になっているため、自動では表示されません。
以下の手順で接続してください：
1. スマホやPCのWi-Fi設定を開く
2. 「ネットワークを手動で追加」を選ぶ
3. Wi-Fi名とパスワードを入力する
4. セキュリティは「WPA2」を選ぶ',
  '自室に別途Wi-Fiルーターを設置すると混線するため、極力設置は避けてください',
  3,
  NULL
)
ON CONFLICT (info_key) DO NOTHING;
