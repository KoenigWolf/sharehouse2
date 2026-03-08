-- ============================================
-- Share House Portal: Building Information
-- Wi-Fi info and shared building information
-- ============================================

-- ============================================
-- 1. Wi-Fi Info Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.wifi_info (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  floor smallint,
  area_name text NOT NULL,
  ssid text NOT NULL,
  password text NOT NULL,
  display_order smallint DEFAULT 0 NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (floor, ssid)
);

-- Index for floor-based queries
CREATE INDEX IF NOT EXISTS idx_wifi_info_floor ON public.wifi_info(floor);

-- Partial unique index for building-wide entries (floor IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_wifi_info_ssid_null_floor
  ON public.wifi_info(ssid) WHERE floor IS NULL;

DROP TRIGGER IF EXISTS on_wifi_info_updated ON public.wifi_info;
CREATE TRIGGER on_wifi_info_updated
  BEFORE UPDATE ON public.wifi_info
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.wifi_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "認証済みユーザーはWi-Fi情報を閲覧可能" ON public.wifi_info;
CREATE POLICY "認証済みユーザーはWi-Fi情報を閲覧可能"
  ON public.wifi_info FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "管理者のみWi-Fi情報を作成可能" ON public.wifi_info;
CREATE POLICY "管理者のみWi-Fi情報を作成可能"
  ON public.wifi_info FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "管理者のみWi-Fi情報を更新可能" ON public.wifi_info;
CREATE POLICY "管理者のみWi-Fi情報を更新可能"
  ON public.wifi_info FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "管理者のみWi-Fi情報を削除可能" ON public.wifi_info;
CREATE POLICY "管理者のみWi-Fi情報を削除可能"
  ON public.wifi_info FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 2. Shared Info Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.shared_info (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  info_key text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  notes text,
  floor smallint,  -- NULL for building-wide info
  display_order smallint DEFAULT 0 NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS on_shared_info_updated ON public.shared_info;
CREATE TRIGGER on_shared_info_updated
  BEFORE UPDATE ON public.shared_info
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index for floor-based queries
CREATE INDEX IF NOT EXISTS idx_shared_info_floor ON public.shared_info(floor);

ALTER TABLE public.shared_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "認証済みユーザーは共用情報を閲覧可能" ON public.shared_info;
CREATE POLICY "認証済みユーザーは共用情報を閲覧可能"
  ON public.shared_info FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "管理者のみ共用情報を作成可能" ON public.shared_info;
CREATE POLICY "管理者のみ共用情報を作成可能"
  ON public.shared_info FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "管理者のみ共用情報を更新可能" ON public.shared_info;
CREATE POLICY "管理者のみ共用情報を更新可能"
  ON public.shared_info FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "管理者のみ共用情報を削除可能" ON public.shared_info;
CREATE POLICY "管理者のみ共用情報を削除可能"
  ON public.shared_info FOR DELETE TO authenticated
  USING (public.is_admin());
