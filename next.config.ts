import type { NextConfig } from "next";

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
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
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
   * Powered by header removed for security
   */
  poweredByHeader: false,

  /**
   * React strict mode for development
   */
  reactStrictMode: true,
};

export default nextConfig;
