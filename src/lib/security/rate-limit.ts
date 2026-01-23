/**
 * Rate Limiting Utility
 * In-memory rate limiter for server-side use
 * For production, consider using Redis or a distributed cache
 */

import { RATE_LIMIT } from "@/lib/constants/config";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (for single-instance deployments)
// For production multi-instance, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Key prefix for namespacing */
  prefix?: string;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Number of requests remaining */
  remaining: number;
  /** Timestamp when the rate limit resets */
  resetTime: number;
  /** Seconds until reset */
  retryAfter: number;
}

/**
 * Check rate limit for a given identifier
 * @param identifier - Unique identifier (e.g., IP address, user ID, email)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const key = `${config.prefix || "rl"}:${identifier}`;
  const entry = rateLimitStore.get(key);

  // If no entry exists or window has passed, create new entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      success: true,
      remaining: config.limit - 1,
      resetTime: newEntry.resetTime,
      retryAfter: 0,
    };
  }

  // Increment count
  entry.count += 1;

  const remaining = Math.max(0, config.limit - entry.count);
  const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

  if (entry.count > config.limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  return {
    success: true,
    remaining,
    resetTime: entry.resetTime,
    retryAfter: 0,
  };
}

/**
 * Preset rate limiters for common use cases
 */
export const RateLimiters = {
  /**
   * Rate limiter for authentication endpoints (login, signup)
   * Strict: 5 attempts per minute
   */
  auth: (identifier: string) =>
    checkRateLimit(identifier, {
      limit: RATE_LIMIT.auth.maxAttempts,
      windowMs: RATE_LIMIT.auth.windowMs,
      prefix: "auth",
    }),

  /**
   * Rate limiter for API requests
   * Standard: 60 requests per minute
   */
  api: (identifier: string) =>
    checkRateLimit(identifier, {
      limit: RATE_LIMIT.api.maxRequestsPerMinute,
      windowMs: 60 * 1000,
      prefix: "api",
    }),

  /**
   * Rate limiter for file uploads
   * Conservative: 10 uploads per hour
   */
  upload: (identifier: string) =>
    checkRateLimit(identifier, {
      limit: RATE_LIMIT.upload.maxUploadsPerHour,
      windowMs: 60 * 60 * 1000,
      prefix: "upload",
    }),

  /**
   * Rate limiter for password reset
   * Very strict: 3 attempts per hour
   */
  passwordReset: (identifier: string) =>
    checkRateLimit(identifier, {
      limit: 3,
      windowMs: 60 * 60 * 1000,
      prefix: "pwd_reset",
    }),
} as const;

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.remaining + (result.success ? 1 : 0)),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetTime),
    ...(result.success ? {} : { "Retry-After": String(result.retryAfter) }),
  };
}

/**
 * Format rate limit error message
 */
export function formatRateLimitError(retryAfter: number): string {
  if (retryAfter < 60) {
    return `リクエストが多すぎます。${retryAfter}秒後に再試行してください。`;
  }
  const minutes = Math.ceil(retryAfter / 60);
  return `リクエストが多すぎます。${minutes}分後に再試行してください。`;
}

/**
 * Clear rate limit store (for testing only)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}
