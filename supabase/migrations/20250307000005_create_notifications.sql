-- ============================================
-- Share House Portal: Notification System
-- Push subscriptions and notification preferences
-- ============================================

-- ============================================
-- 1. Push Subscriptions Table (WebPush)
-- ============================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "自分のプッシュ購読のみ閲覧可能" ON public.push_subscriptions;
CREATE POLICY "自分のプッシュ購読のみ閲覧可能"
  ON public.push_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分のプッシュ購読のみ作成可能" ON public.push_subscriptions;
CREATE POLICY "自分のプッシュ購読のみ作成可能"
  ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分のプッシュ購読のみ削除可能" ON public.push_subscriptions;
CREATE POLICY "自分のプッシュ購読のみ削除可能"
  ON public.push_subscriptions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 2. Notification Settings Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  notify_tea_time boolean DEFAULT true NOT NULL,
  notify_garbage_duty boolean DEFAULT true NOT NULL,
  notify_new_photos boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS on_notification_settings_updated ON public.notification_settings;
CREATE TRIGGER on_notification_settings_updated
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ユーザーは自分の通知設定を閲覧可能" ON public.notification_settings;
CREATE POLICY "ユーザーは自分の通知設定を閲覧可能"
  ON public.notification_settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ユーザーは自分の通知設定を作成可能" ON public.notification_settings;
CREATE POLICY "ユーザーは自分の通知設定を作成可能"
  ON public.notification_settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ユーザーは自分の通知設定を更新可能" ON public.notification_settings;
CREATE POLICY "ユーザーは自分の通知設定を更新可能"
  ON public.notification_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
