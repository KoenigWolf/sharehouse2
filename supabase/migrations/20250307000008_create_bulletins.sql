-- ============================================
-- Share House Portal: Bulletins (Vibe Board)
-- Twitter-style multiple posts per user
-- ============================================

CREATE TABLE IF NOT EXISTS public.bulletins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS bulletins_updated_at ON public.bulletins;
CREATE TRIGGER bulletins_updated_at
  BEFORE UPDATE ON public.bulletins
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS bulletins_user_id_idx ON public.bulletins(user_id);
CREATE INDEX IF NOT EXISTS bulletins_updated_at_idx ON public.bulletins(updated_at DESC);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "認証済みユーザーは掲示板を閲覧可能" ON public.bulletins;
CREATE POLICY "認証済みユーザーは掲示板を閲覧可能"
  ON public.bulletins FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "自分の掲示板メッセージのみ作成可能" ON public.bulletins;
CREATE POLICY "自分の掲示板メッセージのみ作成可能"
  ON public.bulletins FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分の掲示板メッセージのみ更新可能" ON public.bulletins;
CREATE POLICY "自分の掲示板メッセージのみ更新可能"
  ON public.bulletins FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分または管理者が掲示板メッセージを削除可能" ON public.bulletins;
CREATE POLICY "自分または管理者が掲示板メッセージを削除可能"
  ON public.bulletins FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ============================================
-- Foreign Key to profiles (for PostgREST)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bulletins_user_id_profiles_fk'
  ) THEN
    ALTER TABLE public.bulletins
      ADD CONSTRAINT bulletins_user_id_profiles_fk
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- View: Latest bulletin per user
-- ============================================

CREATE OR REPLACE VIEW public.latest_bulletins_per_user
WITH (security_invoker = true) AS
SELECT DISTINCT ON (user_id)
  id,
  user_id,
  message,
  created_at,
  updated_at
FROM public.bulletins
ORDER BY user_id, created_at DESC;
