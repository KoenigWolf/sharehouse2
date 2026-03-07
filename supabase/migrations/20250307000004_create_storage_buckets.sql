-- ============================================
-- Share House Portal: Storage Buckets
-- Consolidated storage configuration for all buckets
-- ============================================

-- ============================================
-- 1. Room Photos Bucket
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-photos',
  'room-photos',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[];

-- Storage policies for room-photos
DROP POLICY IF EXISTS "Authenticated users can view room photos" ON storage.objects;
CREATE POLICY "Authenticated users can view room photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'room-photos');

DROP POLICY IF EXISTS "Authenticated users can upload room photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload room photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'room-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own room photos" ON storage.objects;
CREATE POLICY "Users can update their own room photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'room-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'room-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own room photos" ON storage.objects;
CREATE POLICY "Users can delete their own room photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'room-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- 2. Cover Photos Bucket
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('cover-photos', 'cover-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Cover photos viewable by authenticated" ON storage.objects;
CREATE POLICY "Cover photos viewable by authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'cover-photos');

DROP POLICY IF EXISTS "自分または管理者がカバー写真をアップロード可能" ON storage.objects;
CREATE POLICY "自分または管理者がカバー写真をアップロード可能"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cover-photos'
    AND (auth.uid()::text = split_part(name, '/', 1) OR public.is_admin())
  );

DROP POLICY IF EXISTS "自分または管理者がカバー写真を更新可能" ON storage.objects;
CREATE POLICY "自分または管理者がカバー写真を更新可能"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cover-photos'
    AND (auth.uid()::text = split_part(name, '/', 1) OR public.is_admin())
  );

DROP POLICY IF EXISTS "自分または管理者がカバー写真を削除可能" ON storage.objects;
CREATE POLICY "自分または管理者がカバー写真を削除可能"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cover-photos'
    AND (auth.uid()::text = split_part(name, '/', 1) OR public.is_admin())
  );

-- ============================================
-- 3. Event Covers Bucket
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-covers',
  'event-covers',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view event covers" ON storage.objects;
CREATE POLICY "Anyone can view event covers"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'event-covers');

DROP POLICY IF EXISTS "Users can upload event covers" ON storage.objects;
CREATE POLICY "Users can upload event covers"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update event covers" ON storage.objects;
CREATE POLICY "Users can update event covers"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'event-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete event covers" ON storage.objects;
CREATE POLICY "Users can delete event covers"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- 4. Share Item Images Bucket
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'share-item-images',
  'share-item-images',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can view share item images" ON storage.objects;
CREATE POLICY "Authenticated users can view share item images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'share-item-images');

DROP POLICY IF EXISTS "Authenticated users can upload share item images" ON storage.objects;
CREATE POLICY "Authenticated users can upload share item images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'share-item-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own share item images" ON storage.objects;
CREATE POLICY "Users can update their own share item images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'share-item-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'share-item-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own share item images" ON storage.objects;
CREATE POLICY "Users can delete their own share item images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'share-item-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
