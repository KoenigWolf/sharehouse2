-- Share House Portal: Storage Buckets
-- Consolidated storage configuration for all buckets

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

DROP POLICY IF EXISTS "認証済みユーザーは部屋写真を閲覧可能" ON storage.objects;
CREATE POLICY "認証済みユーザーは部屋写真を閲覧可能"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'room-photos');

DROP POLICY IF EXISTS "自分の部屋写真のみアップロード可能" ON storage.objects;
CREATE POLICY "自分の部屋写真のみアップロード可能"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'room-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "自分の部屋写真のみ更新可能" ON storage.objects;
CREATE POLICY "自分の部屋写真のみ更新可能"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'room-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'room-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "自分の部屋写真のみ削除可能" ON storage.objects;
CREATE POLICY "自分の部屋写真のみ削除可能"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'room-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cover-photos',
  'cover-photos',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

DROP POLICY IF EXISTS "認証済みユーザーはカバー写真を閲覧可能" ON storage.objects;
CREATE POLICY "認証済みユーザーはカバー写真を閲覧可能"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'cover-photos');

DROP POLICY IF EXISTS "自分または管理者がカバー写真をアップロード可能" ON storage.objects;
CREATE POLICY "自分または管理者がカバー写真をアップロード可能"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cover-photos'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "自分または管理者がカバー写真を更新可能" ON storage.objects;
CREATE POLICY "自分または管理者がカバー写真を更新可能"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cover-photos'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  )
  WITH CHECK (
    bucket_id = 'cover-photos'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "自分または管理者がカバー写真を削除可能" ON storage.objects;
CREATE POLICY "自分または管理者がカバー写真を削除可能"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cover-photos'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-covers',
  'event-covers',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

DROP POLICY IF EXISTS "イベントカバー画像は誰でも閲覧可能" ON storage.objects;
CREATE POLICY "イベントカバー画像は誰でも閲覧可能"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'event-covers');

DROP POLICY IF EXISTS "自分のイベントカバー画像のみアップロード可能" ON storage.objects;
CREATE POLICY "自分のイベントカバー画像のみアップロード可能"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "自分のイベントカバー画像のみ更新可能" ON storage.objects;
CREATE POLICY "自分のイベントカバー画像のみ更新可能"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'event-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'event-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "自分のイベントカバー画像のみ削除可能" ON storage.objects;
CREATE POLICY "自分のイベントカバー画像のみ削除可能"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'share-item-images',
  'share-item-images',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

DROP POLICY IF EXISTS "認証済みユーザーはシェア画像を閲覧可能" ON storage.objects;
CREATE POLICY "認証済みユーザーはシェア画像を閲覧可能"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'share-item-images');

DROP POLICY IF EXISTS "自分のシェア画像のみアップロード可能" ON storage.objects;
CREATE POLICY "自分のシェア画像のみアップロード可能"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'share-item-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "自分のシェア画像のみ更新可能" ON storage.objects;
CREATE POLICY "自分のシェア画像のみ更新可能"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'share-item-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'share-item-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "自分のシェア画像のみ削除可能" ON storage.objects;
CREATE POLICY "自分のシェア画像のみ削除可能"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'share-item-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
