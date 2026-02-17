import "server-only";
/**
 * Redis クライアントモジュール
 *
 * REDIS_URL 環境変数が設定されている場合にRedis接続を提供する。
 * 未設定時は null を返し、呼び出し元でインメモリフォールバックを使用する。
 */

import Redis from "ioredis";
import { logError, logWarning } from "@/lib/errors";

let redisClient: Redis | null = null;
let isRedisHealthy = false;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30_000; // 30 seconds

/**
 * Redis クライアントのシングルトンインスタンスを取得する
 *
 * @returns Redis クライアント、または REDIS_URL 未設定時は null
 */
export function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) {
            logWarning("Redis max retries exceeded, falling back to in-memory", {
              action: "redis.retryExhausted",
            });
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
        connectTimeout: 5000,
        commandTimeout: 3000,
      });

      redisClient.on("error", (err) => {
        isRedisHealthy = false;
        logError(err, { action: "redis.connection" });
      });

      redisClient.on("connect", () => {
        isRedisHealthy = true;
        logWarning("Redis connected successfully", {
          action: "redis.connected",
        });
      });

      redisClient.on("close", () => {
        isRedisHealthy = false;
        logWarning("Redis connection closed", {
          action: "redis.closed",
        });
      });
    } catch (err) {
      logError(err, {
        action: "redis.initialization",
        metadata: { error: "Failed to initialize Redis client" },
      });
      return null;
    }
  }

  return redisClient;
}

/**
 * Check if Redis is healthy and available
 * Performs a PING command with timeout
 */
export async function isRedisAvailable(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  // Use cached result if recent
  const now = Date.now();
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return isRedisHealthy;
  }

  try {
    const result = await Promise.race([
      client.ping(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Redis PING timeout")), 2000)
      ),
    ]);

    isRedisHealthy = result === "PONG";
    lastHealthCheck = now;
    return isRedisHealthy;
  } catch (err) {
    isRedisHealthy = false;
    lastHealthCheck = now;
    logWarning("Redis health check failed", {
      action: "redis.healthCheck",
      metadata: { error: err instanceof Error ? err.message : "Unknown error" },
    });
    return false;
  }
}

/**
 * Get Redis connection status for monitoring
 */
export function getRedisStatus(): {
  configured: boolean;
  healthy: boolean;
  lastCheck: number;
} {
  return {
    configured: !!process.env.REDIS_URL,
    healthy: isRedisHealthy,
    lastCheck: lastHealthCheck,
  };
}
