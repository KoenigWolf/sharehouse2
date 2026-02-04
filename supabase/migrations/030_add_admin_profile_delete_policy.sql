-- ============================================
-- profiles: 管理者は全プロフィールを削除可能
-- ============================================
-- adminDeleteAccount が Service Role で実行するため必須ではないが、
-- RLS レベルでも管理者の DELETE 権限を明示的に定義する。

DROP POLICY IF EXISTS "管理者がプロフィールを削除可能" ON public.profiles;
CREATE POLICY "管理者がプロフィールを削除可能"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());
