import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkRateLimit,
  RateLimiters,
  formatRateLimitError,
  clearRateLimitStore,
} from "@/lib/security/rate-limit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    clearRateLimitStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("allows requests under the limit", () => {
      const result = checkRateLimit("test-user", {
        limit: 5,
        windowMs: 60000,
        prefix: "test",
      });

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("blocks requests over the limit", () => {
      const options = { limit: 3, windowMs: 60000, prefix: "test" };

      // Make 3 successful requests
      checkRateLimit("test-user", options);
      checkRateLimit("test-user", options);
      checkRateLimit("test-user", options);

      // 4th request should be blocked
      const result = checkRateLimit("test-user", options);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("resets after window expires", () => {
      const options = { limit: 2, windowMs: 60000, prefix: "test" };

      // Exhaust the limit
      checkRateLimit("test-user", options);
      checkRateLimit("test-user", options);

      // Should be blocked
      expect(checkRateLimit("test-user", options).success).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(61000);

      // Should be allowed again
      const result = checkRateLimit("test-user", options);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it("tracks different identifiers separately", () => {
      const options = { limit: 2, windowMs: 60000, prefix: "test" };

      // Exhaust limit for user1
      checkRateLimit("user1", options);
      checkRateLimit("user1", options);
      expect(checkRateLimit("user1", options).success).toBe(false);

      // user2 should still be allowed
      expect(checkRateLimit("user2", options).success).toBe(true);
    });

    it("tracks different prefixes separately", () => {
      const options1 = { limit: 2, windowMs: 60000, prefix: "auth" };
      const options2 = { limit: 2, windowMs: 60000, prefix: "api" };

      // Exhaust auth limit
      checkRateLimit("user1", options1);
      checkRateLimit("user1", options1);
      expect(checkRateLimit("user1", options1).success).toBe(false);

      // API limit should still be available
      expect(checkRateLimit("user1", options2).success).toBe(true);
    });
  });

  describe("RateLimiters", () => {
    it("auth limiter uses correct configuration", () => {
      // Auth limiter should have 5 attempts per minute
      for (let i = 0; i < 5; i++) {
        expect(RateLimiters.auth("test@example.com").success).toBe(true);
      }
      expect(RateLimiters.auth("test@example.com").success).toBe(false);
    });

    it("api limiter uses correct configuration", () => {
      // API limiter should have 60 requests per minute
      for (let i = 0; i < 60; i++) {
        expect(RateLimiters.api("api-key").success).toBe(true);
      }
      expect(RateLimiters.api("api-key").success).toBe(false);
    });

    it("upload limiter uses correct configuration", () => {
      // Upload limiter should have 100 uploads per hour
      for (let i = 0; i < 100; i++) {
        expect(RateLimiters.upload("user-id").success).toBe(true);
      }
      expect(RateLimiters.upload("user-id").success).toBe(false);
    });
  });

  describe("formatRateLimitError", () => {
    it("formats seconds correctly", () => {
      const error = formatRateLimitError(30);
      expect(error).toContain("30秒");
    });

    it("formats minutes correctly", () => {
      const error = formatRateLimitError(120);
      expect(error).toContain("2分");
    });

    it("handles zero seconds", () => {
      const error = formatRateLimitError(0);
      expect(error).toBeDefined();
    });
  });
});
