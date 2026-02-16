-- Add image_url column to share_items table
ALTER TABLE public.share_items
ADD COLUMN image_url TEXT;

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

-- Storage policies for share-item-images bucket
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
