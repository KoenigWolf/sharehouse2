-- ============================================
-- Share House Portal: Audit Logs
-- Security audit logging for compliance
-- ============================================

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

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_outcome ON public.audit_logs(outcome);

-- Composite index for security event searches
CREATE INDEX IF NOT EXISTS idx_audit_logs_security_events
  ON public.audit_logs(event_type, severity, created_at DESC)
  WHERE severity IN ('WARNING', 'ERROR', 'CRITICAL');

-- ============================================
-- RLS: Admin-only read access
-- ============================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view audit logs" ON public.audit_logs;
CREATE POLICY "Admin can view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- INSERT/UPDATE/DELETE only via service_role

-- ============================================
-- Cleanup Function (90 days normal, 365 days critical)
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < now() - INTERVAL '90 days'
  AND severity NOT IN ('ERROR', 'CRITICAL');

  DELETE FROM public.audit_logs
  WHERE created_at < now() - INTERVAL '365 days';
END;
$$;

-- Comments
COMMENT ON TABLE public.audit_logs IS 'セキュリティ監査ログ - コンプライアンス・インシデント対応用';
COMMENT ON COLUMN public.audit_logs.event_type IS 'イベントタイプ (AUTH_LOGIN_SUCCESS, SECURITY_SUSPICIOUS_ACTIVITY 等)';
COMMENT ON COLUMN public.audit_logs.severity IS '重要度 (INFO, WARNING, ERROR, CRITICAL)';
COMMENT ON COLUMN public.audit_logs.metadata IS 'イベント固有の追加情報 (機密データはマスク済み)';
