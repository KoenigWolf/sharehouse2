-- ============================================
-- Share House Portal: Share Board
-- Item sharing/claiming system
-- ============================================

CREATE TABLE IF NOT EXISTS public.share_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,  -- Nullable: preserved when user is deleted
  title text NOT NULL,
  description text,
  image_url text,
  status text DEFAULT 'available' NOT NULL CHECK (status IN ('available', 'claimed')),
  claimed_by uuid,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS share_items_updated_at ON public.share_items;
CREATE TRIGGER share_items_updated_at
  BEFORE UPDATE ON public.share_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS share_items_status_expires_idx ON public.share_items(status, expires_at);

COMMENT ON COLUMN public.share_items.image_url IS 'URL of the share item image stored in share-item-images bucket';

-- ============================================
-- Foreign Keys with proper deletion semantics
-- ============================================

DO $$
BEGIN
  -- Drop existing FKs
  ALTER TABLE public.share_items DROP CONSTRAINT IF EXISTS share_items_user_id_fkey;
  ALTER TABLE public.share_items DROP CONSTRAINT IF EXISTS share_items_user_id_profiles_fk;
  ALTER TABLE public.share_items DROP CONSTRAINT IF EXISTS share_items_claimed_by_profiles_fk;

  -- Add FK to auth.users with SET NULL (preserve item when owner deleted)
  ALTER TABLE public.share_items
    ADD CONSTRAINT share_items_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

  -- Add FK to profiles for PostgREST
  ALTER TABLE public.share_items
    ADD CONSTRAINT share_items_user_id_profiles_fk
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

  -- Add FK for claimed_by
  ALTER TABLE public.share_items
    ADD CONSTRAINT share_items_claimed_by_profiles_fk
    FOREIGN KEY (claimed_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
END $$;

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.share_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "認証済みユーザーはShareを閲覧可能" ON public.share_items;
CREATE POLICY "認証済みユーザーはShareを閲覧可能"
  ON public.share_items FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "自分のShareのみ作成可能" ON public.share_items;
CREATE POLICY "自分のShareのみ作成可能"
  ON public.share_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Secure update policy:
-- - Owner can update freely
-- - Others can only claim available items to themselves
DROP POLICY IF EXISTS "Shareの更新ポリシー" ON public.share_items;
CREATE POLICY "Shareの更新ポリシー"
  ON public.share_items FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR status = 'available'
  )
  WITH CHECK (
    auth.uid() = user_id OR (
      claimed_by = auth.uid() AND
      status = 'claimed'
    )
  );

COMMENT ON POLICY "Shareの更新ポリシー" ON public.share_items IS
  '所有者は自由に更新可。他ユーザーは available のアイテムを自分宛てに claim する場合のみ更新可能。';

-- ============================================
-- Claim Restriction Trigger
-- 所有者以外は status と claimed_by のみ変更可能
-- ============================================

CREATE OR REPLACE FUNCTION restrict_share_item_claim()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- 所有者は全カラム変更可能
  IF OLD.user_id = auth.uid() THEN
    RETURN NEW;
  END IF;

  -- 所有者以外は status と claimed_by 以外の変更を禁止
  IF (
    NEW.title IS DISTINCT FROM OLD.title OR
    NEW.description IS DISTINCT FROM OLD.description OR
    NEW.image_url IS DISTINCT FROM OLD.image_url OR
    NEW.user_id IS DISTINCT FROM OLD.user_id OR
    NEW.expires_at IS DISTINCT FROM OLD.expires_at
  ) THEN
    RAISE EXCEPTION 'Non-owners can only modify status and claimed_by';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_share_item_claim_restriction ON public.share_items;
CREATE TRIGGER enforce_share_item_claim_restriction
  BEFORE UPDATE ON public.share_items
  FOR EACH ROW
  EXECUTE FUNCTION restrict_share_item_claim();

DROP POLICY IF EXISTS "自分または管理者がShareを削除可能" ON public.share_items;
CREATE POLICY "自分または管理者がShareを削除可能"
  ON public.share_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
