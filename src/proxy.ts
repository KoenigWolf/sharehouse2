import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const isDev = process.env.NODE_ENV === "development";

/**
 * Generate unique request ID for tracing and debugging
 *
 * Format: base36-timestamp + UUID prefix (8 hex chars)
 * - Base36 timestamp provides monotonic ordering for log analysis
 * - UUID prefix ensures uniqueness across concurrent requests
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomUUID().split("-")[0];
  return `${timestamp}-${random}`;
}

export async function proxy(request: NextRequest) {
  // Generate request ID early for response tracing
  // Note: Middleware cannot inject headers into downstream request handlers,
  // so API routes use getApiRequestId() which generates its own fallback
  const requestId = generateRequestId();

  const response = await updateSession(request);

  // Set response header for client-side request tracing and debugging
  response.headers.set("X-Request-ID", requestId);

  const nonce = generateNonce();

  const cspHeader = buildCSPHeader(nonce);
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("x-nonce", nonce);

  return response;
}

function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

function buildCSPHeader(nonce: string): string {
  // Turbopack の HMR は eval を使うため、開発環境では unsafe-eval が必要
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  return [
    "default-src 'self'",
    scriptSrc,
    `style-src 'self' 'unsafe-inline' 'nonce-${nonce}'`,
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.push.services.mozilla.com https://fcm.googleapis.com https://*.notify.windows.com",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
