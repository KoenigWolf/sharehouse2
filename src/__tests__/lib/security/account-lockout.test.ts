import { describe, it, expect, beforeEach } from "vitest";
import {
  checkAccountLockout,
  recordFailedLogin,
  recordSuccessfulLogin,
  clearLockoutStore,
} from "@/lib/security/account-lockout";

describe("Account Lockout", () => {
  beforeEach(() => {
    clearLockoutStore();
  });

  describe("checkAccountLockout", () => {
    it("should return not locked for new accounts", () => {
      const result = checkAccountLockout("test@example.com");
      expect(result.isLocked).toBe(false);
      expect(result.failedAttempts).toBe(0);
    });

    it("should return not locked after few failed attempts", () => {
      recordFailedLogin("test@example.com");
      recordFailedLogin("test@example.com");
      recordFailedLogin("test@example.com");

      const result = checkAccountLockout("test@example.com");
      expect(result.isLocked).toBe(false);
      expect(result.failedAttempts).toBe(3);
    });
  });

  describe("recordFailedLogin", () => {
    it("should track failed attempts", () => {
      const result1 = recordFailedLogin("test@example.com");
      expect(result1.failedAttempts).toBe(1);
      expect(result1.isLocked).toBe(false);

      const result2 = recordFailedLogin("test@example.com");
      expect(result2.failedAttempts).toBe(2);
      expect(result2.isLocked).toBe(false);
    });

    it("should lock account after 5 failed attempts", () => {
      for (let i = 0; i < 4; i++) {
        recordFailedLogin("test@example.com");
      }

      const result = recordFailedLogin("test@example.com");
      expect(result.failedAttempts).toBe(5);
      expect(result.isLocked).toBe(true);
      expect(result.remainingMinutes).toBeGreaterThan(0);
    });

    it("should track attempts separately per email+IP", () => {
      recordFailedLogin("test@example.com", "1.1.1.1");
      recordFailedLogin("test@example.com", "1.1.1.1");

      const result1 = checkAccountLockout("test@example.com", "1.1.1.1");
      expect(result1.failedAttempts).toBe(2);

      const result2 = checkAccountLockout("test@example.com", "2.2.2.2");
      expect(result2.failedAttempts).toBe(0);
    });
  });

  describe("recordSuccessfulLogin", () => {
    it("should reset failed attempts on success", () => {
      recordFailedLogin("test@example.com");
      recordFailedLogin("test@example.com");
      recordFailedLogin("test@example.com");

      recordSuccessfulLogin("test@example.com");

      const result = checkAccountLockout("test@example.com");
      expect(result.failedAttempts).toBe(0);
      expect(result.isLocked).toBe(false);
    });
  });
});
