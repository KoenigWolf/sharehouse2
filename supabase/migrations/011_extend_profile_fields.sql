-- ============================================
-- プロフィール項目拡張
-- 5カテゴリ・約25項目の新規フィールド追加
-- ============================================

-- 基本情報
alter table public.profiles add column if not exists nickname text;
alter table public.profiles add column if not exists age_range text;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists nationality text;
alter table public.profiles add column if not exists languages text[] default '{}';
alter table public.profiles add column if not exists hometown text;

-- 仕事・学歴
alter table public.profiles add column if not exists occupation text;
alter table public.profiles add column if not exists industry text;
alter table public.profiles add column if not exists work_location text;
alter table public.profiles add column if not exists work_style text;

-- ライフスタイル
alter table public.profiles add column if not exists daily_rhythm text;
alter table public.profiles add column if not exists home_frequency text;
alter table public.profiles add column if not exists alcohol text;
alter table public.profiles add column if not exists smoking text;
alter table public.profiles add column if not exists pets text;
alter table public.profiles add column if not exists guest_frequency text;
alter table public.profiles add column if not exists overnight_guests text;

-- 共同生活への姿勢
alter table public.profiles add column if not exists social_stance text;
alter table public.profiles add column if not exists shared_space_usage text;
alter table public.profiles add column if not exists cleaning_attitude text;
alter table public.profiles add column if not exists cooking_frequency text;
alter table public.profiles add column if not exists shared_meals text;

-- 性格・趣味
alter table public.profiles add column if not exists personality_type text;
alter table public.profiles add column if not exists weekend_activities text;
