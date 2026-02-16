-- Add image_url column to share_items table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'share_items'
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.share_items ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Create share-item-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'share-item-images',
  'share-item-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for share-item-images bucket (drop if exists to ensure correct definition)
DROP POLICY IF EXISTS "Authenticated users can view share item images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload share item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own share item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own share item images" ON storage.objects;

CREATE POLICY "Authenticated users can view share item images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'share-item-images');

CREATE POLICY "Authenticated users can upload share item images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'share-item-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own share item images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'share-item-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'share-item-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own share item images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'share-item-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Comment
COMMENT ON COLUMN public.share_items.image_url IS 'URL of the share item image stored in share-item-images bucket';
