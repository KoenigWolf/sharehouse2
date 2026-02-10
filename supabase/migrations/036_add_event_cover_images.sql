-- Add cover_image_url column to events table
ALTER TABLE public.events
ADD COLUMN cover_image_url TEXT;

-- Create event-covers storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-covers',
  'event-covers',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for event-covers bucket
CREATE POLICY "Authenticated users can view event covers"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'event-covers');

CREATE POLICY "Authenticated users can upload event covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own event covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own event covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Comment
COMMENT ON COLUMN public.events.cover_image_url IS 'URL of the event cover image stored in event-covers bucket';
