-- ============================================
-- Share House Portal: Tea Time Matching System
-- Random pairing system for resident interactions
-- ============================================

-- ============================================
-- 1. Tea Time Settings Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.tea_time_settings (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  is_enabled boolean DEFAULT false NOT NULL,
  preferred_time text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS on_tea_time_settings_updated ON public.tea_time_settings;
CREATE TRIGGER on_tea_time_settings_updated
  BEFORE UPDATE ON public.tea_time_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 2. Tea Time Matches Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.tea_time_matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  matched_at timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'scheduled' NOT NULL CHECK (status IN ('scheduled', 'done', 'skipped')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS tea_time_matches_user1_idx ON public.tea_time_matches(user1_id);
CREATE INDEX IF NOT EXISTS tea_time_matches_user2_idx ON public.tea_time_matches(user2_id);
CREATE INDEX IF NOT EXISTS tea_time_matches_matched_at_idx ON public.tea_time_matches(matched_at DESC);

-- ============================================
-- 3. RLS Policies
-- ============================================

-- tea_time_settings
ALTER TABLE public.tea_time_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "認証済みユーザーは参加設定を閲覧可能" ON public.tea_time_settings;
CREATE POLICY "認証済みユーザーは参加設定を閲覧可能"
  ON public.tea_time_settings FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "自分の参加設定のみ作成可能" ON public.tea_time_settings;
CREATE POLICY "自分の参加設定のみ作成可能"
  ON public.tea_time_settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分の参加設定のみ更新可能" ON public.tea_time_settings;
CREATE POLICY "自分の参加設定のみ更新可能"
  ON public.tea_time_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- tea_time_matches
ALTER TABLE public.tea_time_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "自分のマッチのみ閲覧可能" ON public.tea_time_matches;
CREATE POLICY "自分のマッチのみ閲覧可能"
  ON public.tea_time_matches FOR SELECT TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Match creation is done server-side (service_role) only

DROP POLICY IF EXISTS "自分のマッチステータスのみ更新可能" ON public.tea_time_matches;
CREATE POLICY "自分のマッチステータスのみ更新可能"
  ON public.tea_time_matches FOR UPDATE TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);
