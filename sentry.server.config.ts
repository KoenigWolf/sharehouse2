import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // パフォーマンストレーシングのサンプルレート
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // DSN未設定時は無効化
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  debug: false,

  environment: process.env.NODE_ENV,
});
