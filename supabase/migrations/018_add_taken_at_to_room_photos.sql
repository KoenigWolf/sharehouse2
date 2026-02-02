-- ============================================================
-- 018: room_photos に taken_at (撮影日時) カラムを追加
-- EXIF DateTimeOriginal から自動抽出した日時を保存する
-- ============================================================

ALTER TABLE public.room_photos
  ADD COLUMN IF NOT EXISTS taken_at timestamptz;
