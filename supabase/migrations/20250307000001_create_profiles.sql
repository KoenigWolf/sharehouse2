-- ============================================
-- Share House Portal: Profiles & Authentication
-- Consolidated migration including:
-- - Core profile table with all fields
-- - Auth triggers (new user creation, updated_at)
-- - Admin role helper function
-- - RLS policies
-- - Avatars storage bucket
-- ============================================

-- ============================================
-- 1. Helper Functions (used by multiple tables)
-- ============================================

-- updated_at 自動更新用トリガー関数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- RLS ポリシー用の管理者チェックヘルパー関数
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 2. Profiles Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  -- Core identity
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL,
  room_number text,
  bio text,
  avatar_url text,
  cover_photo_url text,
  interests text[] DEFAULT '{}',
  move_in_date date,
  is_admin boolean DEFAULT false NOT NULL,

  -- Basic info
  nickname text,
  age_range text,
  gender text,
  nationality text,
  languages text[] DEFAULT '{}',
  hometown text,

  -- Work & Education
  occupation text,
  industry text,
  work_location text,
  work_style text,

  -- Lifestyle
  daily_rhythm text,
  home_frequency text,
  alcohol text,
  smoking text,
  pets text,
  guest_frequency text,

  -- Shared living attitudes
  social_stance text,
  shared_space_usage text,
  cleaning_attitude text,
  cooking_frequency text,
  shared_meals text,

  -- Personality & Hobbies
  personality_type text,
  weekend_activities text,
  mbti text,
  allergies text,

  -- SNS Links
  sns_x text,
  sns_instagram text,
  sns_facebook text,
  sns_linkedin text,
  sns_github text,

  -- Theme preferences
  theme_style text,
  color_mode text,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT profiles_mbti_check CHECK (
    mbti IS NULL OR mbti IN (
      'INTJ', 'INTP', 'ENTJ', 'ENTP',
      'INFJ', 'INFP', 'ENFJ', 'ENFP',
      'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
      'ISTP', 'ISFP', 'ESTP', 'ESFP'
    )
  ),
  CONSTRAINT profiles_theme_style_check CHECK (
    theme_style IS NULL OR theme_style IN ('modern', 'cottage')
  ),
  CONSTRAINT profiles_color_mode_check CHECK (
    color_mode IS NULL OR color_mode IN ('light', 'dark', 'system')
  )
);

-- updated_at trigger
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 3. Auth User Trigger (auto-create profile)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. RLS Policies
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: 認証済みユーザーは全プロフィールを閲覧可能
DROP POLICY IF EXISTS "認証済みユーザーは全プロフィールを閲覧可能" ON public.profiles;
CREATE POLICY "認証済みユーザーは全プロフィールを閲覧可能"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- INSERT: 自分のプロフィールのみ作成可能
DROP POLICY IF EXISTS "自分のプロフィールのみ作成可能" ON public.profiles;
CREATE POLICY "自分のプロフィールのみ作成可能"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: 自分または管理者がプロフィールを編集可能
DROP POLICY IF EXISTS "自分または管理者がプロフィールを編集可能" ON public.profiles;
CREATE POLICY "自分または管理者がプロフィールを編集可能"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- DELETE: 管理者がプロフィールを削除可能
DROP POLICY IF EXISTS "管理者がプロフィールを削除可能" ON public.profiles;
CREATE POLICY "管理者がプロフィールを削除可能"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 5. Avatars Storage Bucket
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "アバター画像は誰でも閲覧可能" ON storage.objects;
CREATE POLICY "アバター画像は誰でも閲覧可能"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "自分または管理者がアバターをアップロード可能" ON storage.objects;
CREATE POLICY "自分または管理者がアバターをアップロード可能"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "自分または管理者がアバターを更新可能" ON storage.objects;
CREATE POLICY "自分または管理者がアバターを更新可能"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "自分または管理者がアバターを削除可能" ON storage.objects;
CREATE POLICY "自分または管理者がアバターを削除可能"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );
