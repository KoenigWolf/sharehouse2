import { describe, it, expect, vi, beforeEach } from "vitest";
import { clearBreachCache } from "@/lib/security/password-breach";

// Mock fetch for testing
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Password Breach Check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearBreachCache();
  });

  describe("checkPasswordBreach", () => {
    it("should return not breached when password hash not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "ABCDEF1234567890ABCDEF1234567890ABC:5\nDEF1234567890ABCDEF1234567890ABCD:10",
      });

      const { checkPasswordBreach } = await import("@/lib/security/password-breach");
      const result = await checkPasswordBreach("MySecureP@ssw0rd123!");

      expect(result.breached).toBe(false);
    });

    it("should return breached when password hash is found", async () => {
      // SHA-1 of "password" = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
      // Prefix: 5BAA6, Suffix: 1E4C9B93F3F0682250B6CF8331B7EE68FD8
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "1E4C9B93F3F0682250B6CF8331B7EE68FD8:3861493",
      });

      const { checkPasswordBreach } = await import("@/lib/security/password-breach");
      const result = await checkPasswordBreach("password");

      expect(result.breached).toBe(true);
      expect(result.count).toBe(3861493);
    });

    it("should handle API errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { checkPasswordBreach } = await import("@/lib/security/password-breach");
      const result = await checkPasswordBreach("anypassword");

      expect(result.breached).toBe(false);
      expect(result.error).toBe("Check failed");
    });

    it("should handle API timeout gracefully", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      mockFetch.mockRejectedValueOnce(abortError);

      const { checkPasswordBreach } = await import("@/lib/security/password-breach");
      const result = await checkPasswordBreach("anypassword");

      expect(result.breached).toBe(false);
      expect(result.error).toBe("Timeout");
    });

    it("should use cached results", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "ABCDEF:0",
      });

      const { checkPasswordBreach } = await import("@/lib/security/password-breach");

      await checkPasswordBreach("testpassword");
      await checkPasswordBreach("testpassword");

      // Should only call API once due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
