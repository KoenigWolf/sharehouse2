import "server-only";
/**
 * Redis クライアントモジュール
 *
 * REDIS_URL 環境変数が設定されている場合にRedis接続を提供する。
 * 未設定時は null を返し、呼び出し元でインメモリフォールバックを使用する。
 */

import Redis from "ioredis";
import { logError } from "@/lib/errors";

let redisClient: Redis | null = null;

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
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on("error", (err) => {
      logError(err, { action: "redis.connection" });
    });
  }

  return redisClient;
}
