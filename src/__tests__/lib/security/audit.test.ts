import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  auditLog,
  AuditEventType,
  AuditSeverity,
  AuditActions,
} from "@/lib/security/audit";

describe("Audit Logging", () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("auditLog", () => {
    it("logs audit entries with correct format", () => {
      const entry = {
        timestamp: "2024-01-01T00:00:00.000Z",
        eventType: AuditEventType.AUTH_LOGIN_SUCCESS,
        userId: "user-123",
        action: "User logged in",
        outcome: "success" as const,
      };

      auditLog(entry);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining("[AUDIT:INFO]")
      );
    });

    it("includes optional metadata", () => {
      const entry = {
        timestamp: "2024-01-01T00:00:00.000Z",
        eventType: AuditEventType.PROFILE_VIEW,
        userId: "user-123",
        action: "Accessed profile",
        outcome: "success" as const,
        metadata: { profileId: "profile-456" },
      };

      auditLog(entry);

      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it("includes error message for failures", () => {
      const entry = {
        timestamp: "2024-01-01T00:00:00.000Z",
        eventType: AuditEventType.AUTH_LOGIN_FAILURE,
        action: "Login attempt failed",
        outcome: "failure" as const,
        errorMessage: "Invalid credentials",
      };

      auditLog(entry);

      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe("AuditEventType", () => {
    it("has all required event types", () => {
      expect(AuditEventType.AUTH_LOGIN_SUCCESS).toBeDefined();
      expect(AuditEventType.AUTH_LOGIN_FAILURE).toBeDefined();
      expect(AuditEventType.AUTH_LOGOUT).toBeDefined();
      expect(AuditEventType.AUTH_SIGNUP).toBeDefined();
      expect(AuditEventType.PROFILE_VIEW).toBeDefined();
      expect(AuditEventType.PROFILE_UPDATE).toBeDefined();
      expect(AuditEventType.AUTH_RATE_LIMITED).toBeDefined();
      expect(AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY).toBeDefined();
    });
  });

  describe("AuditSeverity", () => {
    it("has all severity levels", () => {
      expect(AuditSeverity.INFO).toBeDefined();
      expect(AuditSeverity.WARNING).toBeDefined();
      expect(AuditSeverity.ERROR).toBeDefined();
      expect(AuditSeverity.CRITICAL).toBeDefined();
    });
  });

  describe("AuditActions", () => {
    it("logs successful login", () => {
      AuditActions.loginSuccess("user-123");
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it("logs failed login", () => {
      AuditActions.loginFailure("test@example.com", "Invalid password");
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("logs rate limiting", () => {
      AuditActions.rateLimited("test@example.com", "auth");
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("logs suspicious activity", () => {
      AuditActions.suspiciousActivity("Multiple failed logins", "user-123");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("logs unauthorized access", () => {
      AuditActions.unauthorizedAccess("user-123", "/admin/users");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
