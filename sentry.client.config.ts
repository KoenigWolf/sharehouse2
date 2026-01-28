import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // パフォーマンストレーシングのサンプルレート（本番環境では低めに設定）
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // セッションリプレイのサンプルレート
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0,

  // DSN未設定時は無効化
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 開発環境ではデバッグ出力
  debug: false,

  environment: process.env.NODE_ENV,
});
