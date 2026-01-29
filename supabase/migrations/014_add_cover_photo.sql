-- カバー写真カラム追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_photo_url text;

-- cover-photos ストレージバケット作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('cover-photos', 'cover-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ストレージポリシー
CREATE POLICY "Cover photos viewable by authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'cover-photos');

CREATE POLICY "Users can upload cover photo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cover-photos'
    AND auth.uid()::text = split_part(name, '-', 1)
  );

CREATE POLICY "Users can update cover photo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cover-photos'
    AND auth.uid()::text = split_part(name, '-', 1)
  );

CREATE POLICY "Users can delete cover photo"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cover-photos'
    AND auth.uid()::text = split_part(name, '-', 1)
  );
