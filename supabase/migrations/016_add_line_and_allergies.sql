-- ============================================
-- LINE ID と アレルギー・食事制限フィールドを追加
-- ============================================

alter table public.profiles add column if not exists sns_line text;
alter table public.profiles add column if not exists allergies text;
