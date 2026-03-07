-- ============================================
-- Share House Portal: Public Teaser Views
-- Masked data for anonymous users
-- ============================================

-- ============================================
-- 1. Residents Public Teaser (Base View)
-- ============================================

DROP VIEW IF EXISTS public.room_photos_public_teaser CASCADE;
DROP VIEW IF EXISTS public.events_public_teaser CASCADE;
DROP VIEW IF EXISTS public.share_items_public_teaser CASCADE;
DROP VIEW IF EXISTS public.bulletins_public_teaser CASCADE;
DROP VIEW IF EXISTS public.residents_public_teaser CASCADE;

CREATE OR REPLACE VIEW public.residents_public_teaser
WITH (security_invoker = true) AS
SELECT
  id,
  CASE WHEN COALESCE(NULLIF(name, ''), NULL) IS NOT NULL
    THEN LEFT(name, 1) || '***'
    ELSE '***'
  END AS masked_name,
  CASE WHEN nickname IS NOT NULL
    THEN LEFT(nickname, 1) || '***'
    ELSE NULL
  END AS masked_nickname,
  LEFT(bio, 50) AS masked_bio,
  age_range,
  occupation,
  industry,
  created_at
FROM public.profiles;

GRANT SELECT ON public.residents_public_teaser TO anon;
GRANT SELECT ON public.residents_public_teaser TO authenticated;

-- ============================================
-- 2. Bulletins Public Teaser
-- ============================================

CREATE OR REPLACE VIEW public.bulletins_public_teaser
WITH (security_invoker = true) AS
SELECT
  b.id,
  b.user_id,
  LEFT(b.message, 20) AS masked_message,
  b.created_at,
  b.updated_at,
  p.masked_name,
  p.masked_nickname
FROM public.bulletins b
JOIN public.residents_public_teaser p ON b.user_id = p.id;

GRANT SELECT ON public.bulletins_public_teaser TO anon;
GRANT SELECT ON public.bulletins_public_teaser TO authenticated;

-- ============================================
-- 3. Share Items Public Teaser
-- ============================================

CREATE OR REPLACE VIEW public.share_items_public_teaser
WITH (security_invoker = true) AS
SELECT
  s.id,
  s.user_id,
  COALESCE(LEFT(s.title, 5), '') || '...' AS masked_title,
  COALESCE(LEFT(s.description, 10), '') || '...' AS masked_description,
  s.status,
  s.expires_at,
  s.created_at,
  p.masked_name,
  p.masked_nickname
FROM public.share_items s
JOIN public.residents_public_teaser p ON s.user_id = p.id;

GRANT SELECT ON public.share_items_public_teaser TO anon;
GRANT SELECT ON public.share_items_public_teaser TO authenticated;

-- ============================================
-- 4. Events Public Teaser
-- ============================================

CREATE OR REPLACE VIEW public.events_public_teaser
WITH (security_invoker = true) AS
SELECT
  e.id,
  e.user_id,
  COALESCE(LEFT(e.title, 5), '') || '...' AS masked_title,
  COALESCE(LEFT(e.description, 10), '') || '...' AS masked_description,
  e.event_date,
  e.event_time,
  e.location,
  e.created_at,
  p.masked_name,
  p.masked_nickname
FROM public.events e
JOIN public.residents_public_teaser p ON e.user_id = p.id;

GRANT SELECT ON public.events_public_teaser TO anon;
GRANT SELECT ON public.events_public_teaser TO authenticated;

-- ============================================
-- 5. Room Photos Public Teaser
-- Note: photo_url intentionally excluded (CSS blur bypassable)
-- ============================================

CREATE OR REPLACE VIEW public.room_photos_public_teaser
WITH (security_invoker = true) AS
SELECT
  rp.id,
  rp.user_id,
  COALESCE(LEFT(rp.caption, 5), '') || '...' AS masked_caption,
  rp.taken_at,
  rp.created_at,
  p.masked_name,
  p.masked_nickname
FROM public.room_photos rp
JOIN public.residents_public_teaser p ON rp.user_id = p.id;

GRANT SELECT ON public.room_photos_public_teaser TO anon;
GRANT SELECT ON public.room_photos_public_teaser TO authenticated;
