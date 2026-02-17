-- ============================================
-- Security: Audit Logs Table
--
-- セキュリティ監査ログを永続化するテーブル
-- コンプライアンス・インシデント対応用
-- ============================================

-- audit_logs テーブル作成
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'INFO',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_id text,
  action text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure')),
  ip_address inet,
  user_agent text,
  metadata jsonb,
  error_message text
);

-- インデックス作成（クエリパフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_outcome ON public.audit_logs(outcome);

-- 複合インデックス（セキュリティイベント検索用）
CREATE INDEX IF NOT EXISTS idx_audit_logs_security_events
  ON public.audit_logs(event_type, severity, created_at DESC)
  WHERE severity IN ('WARNING', 'ERROR', 'CRITICAL');

-- RLSを有効化
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ポリシー: 管理者のみ閲覧可能
CREATE POLICY "Admin can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ポリシー: サービスロールのみ書き込み可能（アプリケーションから）
-- Note: INSERT/UPDATE/DELETE は service_role 経由のみ許可
-- authenticated ユーザーは直接書き込み不可

-- 90日以上古いログを自動削除する関数
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < now() - INTERVAL '90 days'
  AND severity NOT IN ('ERROR', 'CRITICAL');

  -- CRITICAL/ERROR ログは1年間保持
  DELETE FROM public.audit_logs
  WHERE created_at < now() - INTERVAL '365 days';
END;
$$;

-- コメント追加
COMMENT ON TABLE public.audit_logs IS 'セキュリティ監査ログ - コンプライアンス・インシデント対応用';
COMMENT ON COLUMN public.audit_logs.event_type IS 'イベントタイプ (AUTH_LOGIN_SUCCESS, SECURITY_SUSPICIOUS_ACTIVITY 等)';
COMMENT ON COLUMN public.audit_logs.severity IS '重要度 (INFO, WARNING, ERROR, CRITICAL)';
COMMENT ON COLUMN public.audit_logs.metadata IS 'イベント固有の追加情報 (機密データはマスク済み)';
