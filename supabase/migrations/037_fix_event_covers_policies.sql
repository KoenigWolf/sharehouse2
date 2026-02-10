-- Fix event-covers storage policies for public access
-- The bucket is public, so anyone should be able to view images

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view event covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload event covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own event covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own event covers" ON storage.objects;

-- Public read access (required for public bucket URLs to work)
CREATE POLICY "Anyone can view event covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-covers');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload event covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update files in their own folder
CREATE POLICY "Users can update event covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete files in their own folder
CREATE POLICY "Users can delete event covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
