-- ============================================
-- MBTI カラム追加
-- ============================================

-- profiles テーブルに mbti カラムを追加
alter table public.profiles
  add column if not exists mbti text;

-- MBTI の値を制限するチェック制約
alter table public.profiles
  add constraint profiles_mbti_check
  check (
    mbti is null
    or mbti in (
      'INTJ', 'INTP', 'ENTJ', 'ENTP',
      'INFJ', 'INFP', 'ENFJ', 'ENFP',
      'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
      'ISTP', 'ISFP', 'ESTP', 'ESFP'
    )
  );
