-- ============================================
-- Share House Portal: Garbage Collection System
-- Schedule and duty rotation management
-- ============================================

-- ============================================
-- 1. Garbage Schedule Table (admin-managed)
-- ============================================

CREATE TABLE IF NOT EXISTS public.garbage_schedule (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  garbage_type text NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  notes text,
  display_order smallint DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (day_of_week, garbage_type)
);

DROP TRIGGER IF EXISTS on_garbage_schedule_updated ON public.garbage_schedule;
CREATE TRIGGER on_garbage_schedule_updated
  BEFORE UPDATE ON public.garbage_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 2. Garbage Duties Table (rotation assignments)
-- ============================================

CREATE TABLE IF NOT EXISTS public.garbage_duties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  duty_date date NOT NULL,
  garbage_type text NOT NULL,
  is_completed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS garbage_duties_user_id_idx ON public.garbage_duties(user_id);
CREATE INDEX IF NOT EXISTS garbage_duties_date_idx ON public.garbage_duties(duty_date);
CREATE UNIQUE INDEX IF NOT EXISTS garbage_duties_date_type_idx ON public.garbage_duties(duty_date, garbage_type);

-- ============================================
-- 3. RLS Policies
-- ============================================

-- garbage_schedule
ALTER TABLE public.garbage_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "認証済みユーザーはゴミスケジュールを閲覧可能" ON public.garbage_schedule;
CREATE POLICY "認証済みユーザーはゴミスケジュールを閲覧可能"
  ON public.garbage_schedule FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "管理者のみゴミスケジュールを作成可能" ON public.garbage_schedule;
CREATE POLICY "管理者のみゴミスケジュールを作成可能"
  ON public.garbage_schedule FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "管理者のみゴミスケジュールを更新可能" ON public.garbage_schedule;
CREATE POLICY "管理者のみゴミスケジュールを更新可能"
  ON public.garbage_schedule FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "管理者のみゴミスケジュールを削除可能" ON public.garbage_schedule;
CREATE POLICY "管理者のみゴミスケジュールを削除可能"
  ON public.garbage_schedule FOR DELETE TO authenticated
  USING (public.is_admin());

-- garbage_duties
ALTER TABLE public.garbage_duties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "認証済みユーザーはゴミ当番を閲覧可能" ON public.garbage_duties;
CREATE POLICY "認証済みユーザーはゴミ当番を閲覧可能"
  ON public.garbage_duties FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "管理者のみゴミ当番を割り当て可能" ON public.garbage_duties;
CREATE POLICY "管理者のみゴミ当番を割り当て可能"
  ON public.garbage_duties FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "自分の当番完了または管理者は更新可能" ON public.garbage_duties;
CREATE POLICY "自分の当番完了または管理者は更新可能"
  ON public.garbage_duties FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "管理者のみゴミ当番を削除可能" ON public.garbage_duties;
CREATE POLICY "管理者のみゴミ当番を削除可能"
  ON public.garbage_duties FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 4. Assignment Guard Trigger
-- ============================================

CREATE OR REPLACE FUNCTION public.guard_garbage_duty_assignment_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR
     NEW.duty_date IS DISTINCT FROM OLD.duty_date OR
     NEW.garbage_type IS DISTINCT FROM OLD.garbage_type OR
     NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only administrators can change garbage duty assignments';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_garbage_duties_assignment_guard ON public.garbage_duties;
CREATE TRIGGER on_garbage_duties_assignment_guard
  BEFORE UPDATE ON public.garbage_duties
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_garbage_duty_assignment_fields();

-- ============================================
-- 4. Trigger to guard assignment fields
-- Only admins can modify user_id, duty_date, garbage_type
-- ============================================

CREATE OR REPLACE FUNCTION guard_garbage_duty_assignment_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Allow admins to modify any field
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot change assignment fields
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.duty_date IS DISTINCT FROM OLD.duty_date
    OR NEW.garbage_type IS DISTINCT FROM OLD.garbage_type
  THEN
    RAISE EXCEPTION 'Only administrators can modify assignment fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_garbage_duty_assignment ON public.garbage_duties;
CREATE TRIGGER guard_garbage_duty_assignment
  BEFORE UPDATE ON public.garbage_duties
  FOR EACH ROW
  EXECUTE FUNCTION guard_garbage_duty_assignment_fields();
