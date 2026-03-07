-- ============================================
-- Share House Portal: Room Photos
-- Gallery of resident room photos
-- ============================================

CREATE TABLE IF NOT EXISTS public.room_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  caption text,
  display_order smallint DEFAULT 0 NOT NULL,
  taken_at timestamptz,  -- EXIF DateTimeOriginal
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS on_room_photos_updated ON public.room_photos;
CREATE TRIGGER on_room_photos_updated
  BEFORE UPDATE ON public.room_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS room_photos_user_id_idx ON public.room_photos(user_id);
CREATE INDEX IF NOT EXISTS room_photos_created_at_idx ON public.room_photos(created_at DESC);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.room_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "認証済みユーザーは部屋写真を閲覧可能" ON public.room_photos;
CREATE POLICY "認証済みユーザーは部屋写真を閲覧可能"
  ON public.room_photos FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "自分または管理者が部屋写真をアップロード可能" ON public.room_photos;
CREATE POLICY "自分または管理者が部屋写真をアップロード可能"
  ON public.room_photos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "自分または管理者が部屋写真を更新可能" ON public.room_photos;
CREATE POLICY "自分または管理者が部屋写真を更新可能"
  ON public.room_photos FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "自分または管理者が部屋写真を削除可能" ON public.room_photos;
CREATE POLICY "自分または管理者が部屋写真を削除可能"
  ON public.room_photos FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
