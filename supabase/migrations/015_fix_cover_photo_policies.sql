-- カバー写真ストレージポリシー修正
-- 旧ポリシーは split_part(name, '-', 1) でUUIDのハイフンを誤分割していた
-- フォルダ構造（{user_id}/{timestamp}.{ext}）に合わせて '/' で分割するよう修正

DROP POLICY IF EXISTS "Users can upload cover photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update cover photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete cover photo" ON storage.objects;

CREATE POLICY "Users can upload cover photo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cover-photos'
    AND auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Users can update cover photo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cover-photos'
    AND auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Users can delete cover photo"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cover-photos'
    AND auth.uid()::text = split_part(name, '/', 1)
  );
