-- ============================================
-- Share House Portal: Events & Calendar
-- Community events with attendee tracking
-- ============================================

-- ============================================
-- 1. Events Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,  -- Nullable: preserved when user is deleted
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time text,
  location text,
  cover_image_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS events_updated_at ON public.events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS events_date_idx ON public.events(event_date);

COMMENT ON COLUMN public.events.cover_image_url IS 'URL of the event cover image stored in event-covers bucket';

-- ============================================
-- 2. Event Attendees Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_attendees (
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (event_id, user_id)
);

-- ============================================
-- 3. Foreign Keys with proper deletion semantics
-- ============================================

-- Events: SET NULL on user delete (preserve event)
DO $$
BEGIN
  -- Drop existing FK if exists
  ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_user_id_fkey;
  ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_user_id_profiles_fk;

  -- Add FK to auth.users with SET NULL
  ALTER TABLE public.events
    ADD CONSTRAINT events_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

  -- Add FK to profiles for PostgREST
  ALTER TABLE public.events
    ADD CONSTRAINT events_user_id_profiles_fk
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
END $$;

-- Event Attendees: CASCADE on user delete (remove attendance)
DO $$
BEGIN
  ALTER TABLE public.event_attendees DROP CONSTRAINT IF EXISTS event_attendees_user_id_fkey;
  ALTER TABLE public.event_attendees DROP CONSTRAINT IF EXISTS event_attendees_user_id_profiles_fk;

  ALTER TABLE public.event_attendees
    ADD CONSTRAINT event_attendees_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

  ALTER TABLE public.event_attendees
    ADD CONSTRAINT event_attendees_user_id_profiles_fk
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
END $$;

-- ============================================
-- 4. RLS Policies
-- ============================================

-- Events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "認証済みユーザーはイベントを閲覧可能" ON public.events;
CREATE POLICY "認証済みユーザーはイベントを閲覧可能"
  ON public.events FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "自分のイベントのみ作成可能" ON public.events;
CREATE POLICY "自分のイベントのみ作成可能"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分のイベントのみ更新可能" ON public.events;
CREATE POLICY "自分のイベントのみ更新可能"
  ON public.events FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分または管理者がイベントを削除可能" ON public.events;
CREATE POLICY "自分または管理者がイベントを削除可能"
  ON public.events FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Event Attendees
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "認証済みユーザーは参加者を閲覧可能" ON public.event_attendees;
CREATE POLICY "認証済みユーザーは参加者を閲覧可能"
  ON public.event_attendees FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "自分の参加登録のみ作成可能" ON public.event_attendees;
CREATE POLICY "自分の参加登録のみ作成可能"
  ON public.event_attendees FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分の参加登録のみ削除可能" ON public.event_attendees;
CREATE POLICY "自分の参加登録のみ削除可能"
  ON public.event_attendees FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
