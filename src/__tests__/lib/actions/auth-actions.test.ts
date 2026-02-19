import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTranslator } from "@/lib/i18n";

const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/i18n/server", () => ({
  getServerTranslator: vi.fn(() => createTranslator("ja")),
}));

vi.mock("@/lib/security/request", () => ({
  enforceAllowedOrigin: vi.fn(() => null),
  getRequestIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("@/lib/utils/cache", () => ({
  CacheStrategy: {
    afterAuth: vi.fn(),
  },
}));

vi.mock("@/lib/errors", () => ({
  logError: vi.fn(),
}));

vi.mock("@/lib/security", () => ({
  RateLimiters: { auth: vi.fn(() => ({ success: true })) },
  formatRateLimitError: vi.fn(() => "Rate limited"),
  AuditActions: {
    rateLimited: vi.fn(),
    loginFailure: vi.fn(),
    loginSuccess: vi.fn(),
  },
  AuditEventType: {
    AUTH_SIGNUP: "AUTH_SIGNUP",
    SECURITY_VALIDATION_FAILURE: "SECURITY_VALIDATION_FAILURE",
  },
  auditLog: vi.fn(),
  checkPasswordBreach: vi.fn(() => ({ breached: false })),
  BREACH_WARNING_THRESHOLD: 10,
  checkAccountLockout: vi.fn(() => ({ isLocked: false, remainingMinutes: 0, failedAttempts: 0 })),
  recordFailedLogin: vi.fn(() => ({ isLocked: false, remainingMinutes: 0, failedAttempts: 1 })),
  recordSuccessfulLogin: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
  cookies: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
}));

const t = createTranslator("ja");

describe("signUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for empty name", async () => {
    const { signUp } = await import("@/lib/auth/actions");
    const result = await signUp("", "test@example.com", "Password123");

    expect(result).toHaveProperty("error");
  });

  it("should return error for invalid email", async () => {
    const { signUp } = await import("@/lib/auth/actions");
    const result = await signUp("Test", "not-an-email", "Password123");

    expect(result).toHaveProperty("error");
  });

  it("should return error for weak password (no uppercase)", async () => {
    const { signUp } = await import("@/lib/auth/actions");
    const result = await signUp("Test", "test@example.com", "password123");

    expect(result).toHaveProperty("error");
  });

  it("should return error for short password", async () => {
    const { signUp } = await import("@/lib/auth/actions");
    const result = await signUp("Test", "test@example.com", "Pass1");

    expect(result).toHaveProperty("error");
  });

  it("should return error when Supabase signup fails", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Signup failed" },
    });

    const { signUp } = await import("@/lib/auth/actions");
    const result = await signUp("Test", "test@example.com", "Password123");

    expect(result).toHaveProperty("error");
  });

  it("should detect already registered email", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });

    const { signUp } = await import("@/lib/auth/actions");
    const result = await signUp("Test", "test@example.com", "Password123");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("auth.emailAlreadyExists"));
  });

  it("should handle email confirmation required", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "user-123", identities: [{ id: "1" }] },
        session: null,
      },
      error: null,
    });

    const { signUp } = await import("@/lib/auth/actions");
    const result = await signUp("Test", "test@example.com", "Password123");

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("needsEmailConfirmation", true);
  });

  it("should create profile on successful signup with session", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "user-123", identities: [{ id: "1" }] },
        session: { access_token: "token" },
      },
      error: null,
    });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    const { signUp } = await import("@/lib/auth/actions");
    const result = await signUp("Test", "test@example.com", "Password123");

    expect(result).toEqual({ success: true });
  });
});

describe("signIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for empty email", async () => {
    const { signIn } = await import("@/lib/auth/actions");
    const result = await signIn("", "password");

    expect(result).toHaveProperty("error");
  });

  it("should return error for empty password", async () => {
    const { signIn } = await import("@/lib/auth/actions");
    const result = await signIn("test@example.com", "");

    expect(result).toHaveProperty("error");
  });

  it("should return error on invalid credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const { signIn } = await import("@/lib/auth/actions");
    const result = await signIn("test@example.com", "wrongpassword");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("auth.invalidCredentials"));
  });

  it("should sign in successfully with existing profile", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: { id: "user-123" },
        session: { access_token: "token" },
      },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "user-123" } }),
        }),
      }),
    });

    const { signIn } = await import("@/lib/auth/actions");
    const result = await signIn("test@example.com", "Password123");

    expect(result).toEqual({ success: true });
  });

  it("should create profile if none exists on sign in", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          user_metadata: { name: "Test" },
          email: "test@example.com",
        },
        session: { access_token: "token" },
      },
      error: null,
    });

    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      })
      .mockReturnValueOnce({
        insert: mockInsert,
      });

    const { signIn } = await import("@/lib/auth/actions");
    const result = await signIn("test@example.com", "Password123");

    expect(result).toEqual({ success: true });
    expect(mockInsert).toHaveBeenCalled();
  });
});
