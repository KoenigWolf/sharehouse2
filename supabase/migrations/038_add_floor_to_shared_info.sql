-- ============================================
-- shared_info に floor カラムを追加
-- Wi-Fi・郵便受け・住所などを階ごとに管理可能に
-- ============================================

-- floor カラムを追加（null許可：全階共通の情報用）
alter table public.shared_info add column if not exists floor smallint;

-- インデックス追加
create index if not exists idx_shared_info_floor on public.shared_info(floor);

-- ============================================
-- 既存データを階別に更新
-- ============================================

-- 既存の郵便受け情報を5F用に更新
update public.shared_info
set floor = 5, title = '郵便受け'
where info_key = 'mailbox_code';

-- 既存の住所を5F用に更新
update public.shared_info
set floor = 5, title = '住所'
where info_key = 'address';

-- 2F用の郵便受けと住所（サンプルデータ）
insert into public.shared_info (info_key, title, content, notes, display_order, floor)
values
  ('mailbox_code_2f', '郵便受け', '左に2回「4」、右に1回「8」', '「248」で覚えてください', 1, 2),
  ('address_2f', '住所', '東京都文京区白山3丁目3番4号 田中ビル', null, 2, 2)
on conflict (info_key) do update set
  title = excluded.title,
  content = excluded.content,
  notes = excluded.notes,
  floor = excluded.floor;

-- 田中ビル全体用（floor = 0）サンプルデータ
-- 注: 実際の暗証番号は管理画面から設定してください
-- 既存データがある場合は上書きしない（DO NOTHING）
insert into public.shared_info (info_key, title, content, notes, display_order, floor)
values
  ('building_entrance', 'エントランス', '【要設定】管理画面から実際の暗証番号を入力してください', '夜間（22:00〜7:00）はオートロック', 1, 0),
  ('building_garbage', 'ゴミ集積所', '1Fエントランス横', '収集日の朝8時までに出してください', 2, 0)
on conflict (info_key) do nothing;

-- Wi-Fi注意事項は全階共通（floor = null）のまま
