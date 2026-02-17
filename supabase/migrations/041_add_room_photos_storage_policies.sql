-- ============================================
-- Fix: room-photos バケットに Storage RLS ポリシーを追加
--
-- 問題: room-photos バケットにポリシーが未定義で、
--       任意の認証ユーザーが他ユーザーの写真を削除/上書き可能だった
-- ============================================

-- 既存ポリシーがあれば削除（冪等性確保）
DROP POLICY IF EXISTS "Authenticated users can view room photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload room photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own room photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own room photos" ON storage.objects;

-- SELECT: 認証済みユーザーは閲覧可能
CREATE POLICY "Authenticated users can view room photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'room-photos');

-- INSERT: 自分のフォルダにのみアップロード可能
CREATE POLICY "Authenticated users can upload room photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'room-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: 自分のファイルのみ更新可能
CREATE POLICY "Users can update their own room photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'room-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'room-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: 自分のファイルのみ削除可能
CREATE POLICY "Users can delete their own room photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'room-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- バケット設定の更新（サイズ制限・MIME制限を追加）
UPDATE storage.buckets
SET
  file_size_limit = 10485760,  -- 10MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]
WHERE id = 'room-photos';
