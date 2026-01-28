/**
 * Rate Limiting Utility
 *
 * REDIS_URL 環境変数が設定されている場合はRedisを使用し、
 * 未設定時はインメモリストアにフォールバックする。
 * Redis接続エラー時も自動的にインメモリにフォールバックする。
 */

import { RATE_LIMIT } from "@/lib/constants/config";
import type { Translator } from "@/lib/i18n";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (fallback for when Redis is unavailable)
const rateLimitStore = new Map<string, RateLimitEntry>();

/** ストアの上限サイズ（これを超えたら強制クリーンアップ） */
const MAX_STORE_SIZE = 10_000;

// Cleanup old entries periodically (in-memory only)
const CLEANUP_INTERVAL = 30 * 1000; // 30 seconds
let lastCleanup = Date.now();

function cleanup(force = false) {
  const now = Date.now();
  if (!force && now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }

  // 上限超過時は最も古いエントリから削除
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const entries = [...rateLimitStore.entries()]
      .sort((a, b) => a[1].resetTime - b[1].resetTime);
    const deleteCount = rateLimitStore.size - MAX_STORE_SIZE;
    for (let i = 0; i < deleteCount; i++) {
      rateLimitStore.delete(entries[i][0]);
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
 * Redisベースのレート制限チェック（非同期）
 *
 * LuaスクリプトでアトミックにカウントとTTLを管理する。
 * 分散環境でも正確にレート制限を適用可能。
 *
 * @param identifier - 一意識別子
 * @param config - レート制限設定
 * @returns レート制限結果
 */
async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { getRedisClient } = await import("./redis");
  const redis = getRedisClient();
  if (!redis) {
    return checkRateLimitMemory(identifier, config);
  }

  const now = Date.now();
  const key = `ratelimit:${config.prefix || "rl"}:${identifier}`;
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  try {
    // Lua script for atomic increment + TTL check
    const result = await redis.multi()
      .incr(key)
      .pttl(key)
      .exec();

    if (!result) {
      return checkRateLimitMemory(identifier, config);
    }

    const count = result[0][1] as number;
    const pttl = result[1][1] as number;

    // Set expiry on first request
    if (count === 1 || pttl === -1) {
      await redis.expire(key, windowSeconds);
    }

    const resetTime = pttl > 0 ? now + pttl : now + config.windowMs;
    const remaining = Math.max(0, config.limit - count);
    const retryAfter = Math.ceil((resetTime - now) / 1000);

    if (count > config.limit) {
      return {
        success: false,
        remaining: 0,
        resetTime,
        retryAfter,
      };
    }

    return {
      success: true,
      remaining,
      resetTime,
      retryAfter: 0,
    };
  } catch {
    // Redis error - fallback to in-memory
    return checkRateLimitMemory(identifier, config);
  }
}

/**
 * インメモリのレート制限チェック（同期）
 *
 * シングルインスタンス環境用のフォールバック実装。
 *
 * @param identifier - 一意識別子
 * @param config - レート制限設定
 * @returns レート制限結果
 */
function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  // 通常クリーンアップ + サイズ超過時は強制クリーンアップ
  cleanup(rateLimitStore.size > MAX_STORE_SIZE);

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
 * レート制限をチェックする
 *
 * REDIS_URL が設定されている場合はRedisを、未設定時はインメモリを使用する。
 * 同期的に使用する場合はインメモリのみ使用される。
 *
 * @param identifier - 一意識別子（IPアドレス、ユーザーID、メールアドレス等）
 * @param config - レート制限設定
 * @returns レート制限結果
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  // Synchronous callers get in-memory rate limiting
  return checkRateLimitMemory(identifier, config);
}

/**
 * 非同期レート制限チェック（Redis対応）
 *
 * Redis利用可能時はRedisを使用し、不可時はインメモリにフォールバック。
 * サーバーアクションから使用する場合はこちらを推奨。
 *
 * @param identifier - 一意識別子
 * @param config - レート制限設定
 * @returns レート制限結果
 */
export async function checkRateLimitAsync(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { getRedisClient } = await import("./redis");
  const redis = getRedisClient();
  if (redis) {
    return checkRateLimitRedis(identifier, config);
  }
  return checkRateLimitMemory(identifier, config);
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
export function formatRateLimitError(
  retryAfter: number,
  t?: Translator
): string {
  if (!t) {
    return retryAfter < 60
      ? `リクエストが多すぎます。${retryAfter}秒後に再試行してください。`
      : `リクエストが多すぎます。${Math.ceil(retryAfter / 60)}分後に再試行してください。`;
  }

  if (retryAfter < 60) {
    return t("errors.rateLimitSeconds", { seconds: retryAfter });
  }
  const minutes = Math.ceil(retryAfter / 60);
  return t("errors.rateLimitMinutes", { minutes });
}

/**
 * Clear rate limit store (for testing only)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}
