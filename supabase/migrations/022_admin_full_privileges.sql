-- ============================================
-- 管理者フル権限: RLS ポリシー拡張
-- ============================================

-- ----------------------------------------
-- profiles: 管理者は全プロフィールを編集可能
-- ----------------------------------------
DROP POLICY IF EXISTS "自分のプロフィールのみ編集可能" ON public.profiles;
DROP POLICY IF EXISTS "自分または管理者がプロフィールを編集可能" ON public.profiles;
CREATE POLICY "自分または管理者がプロフィールを編集可能"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ----------------------------------------
-- room_photos: 管理者は全写真を管理可能
-- ----------------------------------------
DROP POLICY IF EXISTS "自分の部屋写真のみアップロード可能" ON public.room_photos;
DROP POLICY IF EXISTS "自分または管理者が部屋写真をアップロード可能" ON public.room_photos;
CREATE POLICY "自分または管理者が部屋写真をアップロード可能"
  ON public.room_photos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "自分の部屋写真のみ更新可能" ON public.room_photos;
DROP POLICY IF EXISTS "自分または管理者が部屋写真を更新可能" ON public.room_photos;
CREATE POLICY "自分または管理者が部屋写真を更新可能"
  ON public.room_photos FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "自分の部屋写真のみ削除可能" ON public.room_photos;
DROP POLICY IF EXISTS "自分または管理者が部屋写真を削除可能" ON public.room_photos;
CREATE POLICY "自分または管理者が部屋写真を削除可能"
  ON public.room_photos FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------
-- events: 管理者は全イベントを削除可能
-- ----------------------------------------
DROP POLICY IF EXISTS "自分のイベントのみ削除可能" ON public.events;
DROP POLICY IF EXISTS "自分または管理者がイベントを削除可能" ON public.events;
CREATE POLICY "自分または管理者がイベントを削除可能"
  ON public.events FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------
-- bulletins: 管理者は全掲示板メッセージを削除可能
-- ----------------------------------------
DROP POLICY IF EXISTS "自分の掲示板メッセージのみ削除可能" ON public.bulletins;
DROP POLICY IF EXISTS "自分または管理者が掲示板メッセージを削除可能" ON public.bulletins;
CREATE POLICY "自分または管理者が掲示板メッセージを削除可能"
  ON public.bulletins FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------
-- share_items: 管理者は全シェア品を削除可能
-- ----------------------------------------
DROP POLICY IF EXISTS "自分のおすそわけのみ削除可能" ON public.share_items;
DROP POLICY IF EXISTS "自分または管理者がおすそわけを削除可能" ON public.share_items;
CREATE POLICY "自分または管理者がおすそわけを削除可能"
  ON public.share_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------
-- avatars Storage: 管理者は全アバターを管理可能
-- ----------------------------------------
DROP POLICY IF EXISTS "自分のアバターのみアップロード可能" ON storage.objects;
DROP POLICY IF EXISTS "自分または管理者がアバターをアップロード可能" ON storage.objects;
CREATE POLICY "自分または管理者がアバターをアップロード可能"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "自分のアバターのみ更新可能" ON storage.objects;
DROP POLICY IF EXISTS "自分または管理者がアバターを更新可能" ON storage.objects;
CREATE POLICY "自分または管理者がアバターを更新可能"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "自分のアバターのみ削除可能" ON storage.objects;
DROP POLICY IF EXISTS "自分または管理者がアバターを削除可能" ON storage.objects;
CREATE POLICY "自分または管理者がアバターを削除可能"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- ----------------------------------------
-- cover-photos Storage: 管理者は全カバー写真を管理可能
-- ----------------------------------------
DROP POLICY IF EXISTS "Users can upload cover photo" ON storage.objects;
DROP POLICY IF EXISTS "自分または管理者がカバー写真をアップロード可能" ON storage.objects;
CREATE POLICY "自分または管理者がカバー写真をアップロード可能"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cover-photos'
    AND (auth.uid()::text = split_part(name, '/', 1) OR public.is_admin())
  );

DROP POLICY IF EXISTS "Users can update cover photo" ON storage.objects;
DROP POLICY IF EXISTS "自分または管理者がカバー写真を更新可能" ON storage.objects;
CREATE POLICY "自分または管理者がカバー写真を更新可能"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cover-photos'
    AND (auth.uid()::text = split_part(name, '/', 1) OR public.is_admin())
  );

DROP POLICY IF EXISTS "Users can delete cover photo" ON storage.objects;
DROP POLICY IF EXISTS "自分または管理者がカバー写真を削除可能" ON storage.objects;
CREATE POLICY "自分または管理者がカバー写真を削除可能"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cover-photos'
    AND (auth.uid()::text = split_part(name, '/', 1) OR public.is_admin())
  );

-- ----------------------------------------
-- 初期管理者設定
-- ----------------------------------------
UPDATE public.profiles
SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'toshikiii7@outlook.com');
