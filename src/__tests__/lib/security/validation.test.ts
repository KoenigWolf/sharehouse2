import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isValidUUID,
  isMockId,
  sanitizeHtml,
  stripHtml,
  sanitizeForStorage,
  sanitizeEmail,
  timingSafeEqual,
  validateCronSecret,
} from "@/lib/security/validation";

describe("Security Validation", () => {
  describe("isValidUUID", () => {
    it("accepts valid UUID v4", () => {
      // UUID v4 format: 8-4-4[4xxx]-4[89ab]xxx-12
      expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(isValidUUID("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
    });

    it("accepts uppercase UUIDs", () => {
      expect(isValidUUID("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
    });

    it("rejects invalid UUIDs", () => {
      expect(isValidUUID("")).toBe(false);
      expect(isValidUUID("not-a-uuid")).toBe(false);
      expect(isValidUUID("550e8400-e29b-41d4-a716")).toBe(false);
      expect(isValidUUID("550e8400-e29b-41d4-a716-4466554400001")).toBe(false);
      expect(isValidUUID("550e8400e29b41d4a716446655440000")).toBe(false);
    });

    it("rejects non-v4 UUIDs", () => {
      // Version 1 UUID (starts with 1 in 3rd group)
      expect(isValidUUID("550e8400-e29b-11d4-a716-446655440000")).toBe(false);
      // Invalid variant (not 8,9,a,b in 4th group)
      expect(isValidUUID("550e8400-e29b-41d4-7716-446655440000")).toBe(false);
    });

    it("rejects SQL injection attempts", () => {
      expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000' OR '1'='1")).toBe(false);
      expect(isValidUUID("'; DROP TABLE users; --")).toBe(false);
    });

    it("rejects path traversal attempts", () => {
      expect(isValidUUID("../../../etc/passwd")).toBe(false);
      expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000/../../")).toBe(false);
    });
  });

  describe("isMockId", () => {
    it("detects mock IDs starting with mock-", () => {
      expect(isMockId("mock-001")).toBe(true);
      expect(isMockId("mock-user")).toBe(true);
    });

    it("rejects non-mock IDs", () => {
      expect(isMockId("550e8400-e29b-41d4-a716-446655440000")).toBe(false);
      expect(isMockId("regular-user-id")).toBe(false);
      expect(isMockId("MOCK-USER-2")).toBe(false); // case sensitive
    });
  });

  describe("sanitizeHtml", () => {
    it("escapes HTML entities including forward slash", () => {
      expect(sanitizeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#39;xss&#39;)&lt;&#x2F;script&gt;"
      );
    });

    it("escapes ampersands", () => {
      expect(sanitizeHtml("foo & bar")).toBe("foo &amp; bar");
    });

    it("escapes quotes", () => {
      expect(sanitizeHtml('"quoted" & \'single\'')).toBe(
        "&quot;quoted&quot; &amp; &#39;single&#39;"
      );
    });

    it("handles empty strings", () => {
      expect(sanitizeHtml("")).toBe("");
    });
  });

  describe("stripHtml", () => {
    it("removes HTML tags", () => {
      expect(stripHtml("<p>Hello <strong>World</strong></p>")).toBe("Hello World");
    });

    it("removes script tags but not their content", () => {
      // Note: stripHtml only removes tags, not content
      expect(stripHtml("<script>alert('xss')</script>Hello")).toBe("alert('xss')Hello");
    });

    it("handles self-closing tags", () => {
      expect(stripHtml("Line 1<br/>Line 2")).toBe("Line 1Line 2");
    });

    it("handles empty strings", () => {
      expect(stripHtml("")).toBe("");
    });

    it("preserves plain text", () => {
      expect(stripHtml("Just plain text")).toBe("Just plain text");
    });
  });

  describe("sanitizeForStorage", () => {
    it("strips HTML and normalizes whitespace", () => {
      expect(sanitizeForStorage("<p>Hello   World</p>")).toBe("Hello World");
    });

    it("trims leading/trailing whitespace", () => {
      expect(sanitizeForStorage("  Hello World  ")).toBe("Hello World");
    });

    it("handles multiple spaces", () => {
      expect(sanitizeForStorage("Hello    World")).toBe("Hello World");
    });

    it("handles newlines", () => {
      expect(sanitizeForStorage("Hello\n\nWorld")).toBe("Hello World");
    });

    it("handles empty strings", () => {
      expect(sanitizeForStorage("")).toBe("");
    });
  });

  describe("sanitizeEmail", () => {
    it("lowercases email", () => {
      expect(sanitizeEmail("Test@Example.COM")).toBe("test@example.com");
    });

    it("trims whitespace", () => {
      expect(sanitizeEmail("  test@example.com  ")).toBe("test@example.com");
    });

    it("preserves valid email characters", () => {
      // sanitizeEmail only lowercases and trims, doesn't strip characters
      expect(sanitizeEmail("test@example.com")).toBe("test@example.com");
    });

    it("handles empty strings", () => {
      expect(sanitizeEmail("")).toBe("");
    });

    it("truncates long emails to 255 characters", () => {
      const longEmail = "a".repeat(300) + "@example.com";
      expect(sanitizeEmail(longEmail).length).toBe(255);
    });
  });

  describe("timingSafeEqual", () => {
    it("returns true for equal strings", () => {
      expect(timingSafeEqual("hello", "hello")).toBe(true);
      expect(timingSafeEqual("Bearer secret123", "Bearer secret123")).toBe(true);
      expect(timingSafeEqual("", "")).toBe(true);
    });

    it("returns false for different strings", () => {
      expect(timingSafeEqual("hello", "world")).toBe(false);
      expect(timingSafeEqual("abc", "abd")).toBe(false);
      expect(timingSafeEqual("Bearer secret123", "Bearer secret456")).toBe(false);
    });

    it("returns false for different length strings", () => {
      expect(timingSafeEqual("short", "longer string")).toBe(false);
      expect(timingSafeEqual("", "not empty")).toBe(false);
      expect(timingSafeEqual("abc", "ab")).toBe(false);
    });

    it("handles non-string inputs", () => {
      expect(timingSafeEqual(null as unknown as string, "test")).toBe(false);
      expect(timingSafeEqual("test", undefined as unknown as string)).toBe(false);
      expect(timingSafeEqual(123 as unknown as string, "123")).toBe(false);
    });

    it("handles special characters", () => {
      expect(timingSafeEqual("!@#$%^&*()", "!@#$%^&*()")).toBe(true);
      expect(timingSafeEqual("日本語", "日本語")).toBe(true);
      expect(timingSafeEqual("🔐🔑", "🔐🔑")).toBe(true);
    });
  });

  describe("validateCronSecret", () => {
    const originalEnv = process.env.CRON_SECRET;

    beforeEach(() => {
      process.env.CRON_SECRET = "test-secret-123";
    });

    afterEach(() => {
      if (originalEnv) {
        process.env.CRON_SECRET = originalEnv;
      } else {
        delete process.env.CRON_SECRET;
      }
    });

    it("returns true for valid CRON secret", () => {
      expect(validateCronSecret("Bearer test-secret-123")).toBe(true);
    });

    it("returns false for invalid CRON secret", () => {
      expect(validateCronSecret("Bearer wrong-secret")).toBe(false);
      expect(validateCronSecret("Bearer ")).toBe(false);
    });

    it("returns false for missing Bearer prefix", () => {
      expect(validateCronSecret("test-secret-123")).toBe(false);
    });

    it("returns false for null/empty auth header", () => {
      expect(validateCronSecret(null)).toBe(false);
      expect(validateCronSecret("")).toBe(false);
    });

    it("returns false when CRON_SECRET is not set", () => {
      delete process.env.CRON_SECRET;
      expect(validateCronSecret("Bearer test-secret-123")).toBe(false);
    });

    it("is case sensitive", () => {
      expect(validateCronSecret("bearer test-secret-123")).toBe(false);
      expect(validateCronSecret("BEARER test-secret-123")).toBe(false);
    });
  });
});
