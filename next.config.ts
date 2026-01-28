import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Security headers configuration
 * Implements OWASP security best practices
 */
const securityHeaders = [
  // Prevent XSS attacks by controlling browser behavior
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // Prevent MIME type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Prevent clickjacking attacks
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Control referrer information
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Disable browser features that could be exploited
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // DNS prefetch control
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  // Strict Transport Security (HSTS)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Content Security Policy - Moved to middleware.ts with nonce support
  // CSP with nonce provides better XSS protection than 'unsafe-inline'
];

const nextConfig: NextConfig = {
  /**
   * Security headers applied to all routes
   */
  headers: async () => [
    {
      source: "/:path*",
      headers: securityHeaders,
    },
  ],

  /**
   * Redirect HTTP to HTTPS in production
   */
  redirects: async () => {
    if (process.env.NODE_ENV === "production") {
      return [
        {
          source: "/:path*",
          has: [{ type: "header", key: "x-forwarded-proto", value: "http" }],
          destination: "https://:host/:path*",
          permanent: true,
        },
      ];
    }
    return [];
  },

  /**
   * Image optimization for Supabase Storage
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  /**
   * Powered by header removed for security
   */
  poweredByHeader: false,

  /**
   * React strict mode for development
   */
  reactStrictMode: true,
};

export default withSentryConfig(nextConfig, {
  // ソースマップをSentryにアップロード（CI/CDで SENTRY_AUTH_TOKEN 設定時に有効）
  silent: true,

  // ソースマップの設定
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // トンネルルートでAdBlockerを回避
  tunnelRoute: "/monitoring",

  // デバッグログの除去（バンドルサイズ最適化）
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
});
