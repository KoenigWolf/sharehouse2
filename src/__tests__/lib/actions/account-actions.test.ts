import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTranslator } from "@/lib/i18n";

const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockFrom = vi.fn();
const mockStorage = vi.fn();

vi.mock("@/lib/env", () => ({
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_ANON_KEY: "test-anon-key",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser, updateUser: mockUpdateUser },
    from: mockFrom,
    storage: { from: mockStorage },
  })),
}));

const mockSignInWithPassword = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      admin: { deleteUser: vi.fn().mockResolvedValue({ error: null }) },
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    auth: { admin: { deleteUser: vi.fn().mockResolvedValue({ error: null }) } },
  })),
}));

vi.mock("@/lib/i18n/server", () => ({
  getServerTranslator: vi.fn(() => createTranslator("ja")),
}));

vi.mock("@/lib/security/request", () => ({
  enforceAllowedOrigin: vi.fn(() => null),
}));

vi.mock("@/lib/errors", () => ({
  logError: vi.fn(),
}));

vi.mock("@/lib/security", () => ({
  RateLimiters: {
    passwordReset: vi.fn(() => ({ success: true })),
  },
  formatRateLimitError: vi.fn(() => "Rate limit exceeded"),
  AuditEventType: {
    AUTH_PASSWORD_CHANGE: "AUTH_PASSWORD_CHANGE",
    AUTH_EMAIL_CHANGE: "AUTH_EMAIL_CHANGE",
    AUTH_ACCOUNT_DELETE: "AUTH_ACCOUNT_DELETE",
  },
  auditLog: vi.fn(),
}));

const t = createTranslator("ja");

describe("changePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { changePassword } = await import("@/lib/account/actions");
    const result = await changePassword("old", "NewPass123A");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should return error when current password is empty", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });

    const { changePassword } = await import("@/lib/account/actions");
    const result = await changePassword("", "NewPass123A");

    expect(result).toHaveProperty("error");
  });

  it("should return error when new password is weak", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });

    const { changePassword } = await import("@/lib/account/actions");
    const result = await changePassword("OldPass123", "short");

    expect(result).toHaveProperty("error");
  });

  it("should return error when current password is wrong", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid credentials" },
    });

    const { changePassword } = await import("@/lib/account/actions");
    const result = await changePassword("WrongPass1", "NewPass123A");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("account.currentPasswordWrong"));
  });

  it("should change password successfully", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: null });

    const { changePassword } = await import("@/lib/account/actions");
    const result = await changePassword("OldPass123", "NewPass123A");

    expect(result).toEqual({ success: true });
  });

  it("should return error when rate limited", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });

    const { RateLimiters } = await import("@/lib/security");
    vi.mocked(RateLimiters.passwordReset).mockReturnValueOnce({
      success: false,
      remaining: 0,
      resetTime: Date.now() + 3600000,
      retryAfter: 3600,
    });

    const { changePassword } = await import("@/lib/account/actions");
    const result = await changePassword("OldPass123", "NewPass123A");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe("Rate limit exceeded");
  });

  it("should return error when updateUser fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: { message: "update failed" } });

    const { changePassword } = await import("@/lib/account/actions");
    const result = await changePassword("OldPass123", "NewPass123A");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.serverError"));
  });
});

describe("changeEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { changeEmail } = await import("@/lib/account/actions");
    const result = await changeEmail("new@example.com");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should return error for invalid email", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });

    const { changeEmail } = await import("@/lib/account/actions");
    const result = await changeEmail("not-an-email");

    expect(result).toHaveProperty("error");
  });

  it("should change email successfully", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });
    mockUpdateUser.mockResolvedValue({ error: null });

    const { changeEmail } = await import("@/lib/account/actions");
    const result = await changeEmail("new@example.com");

    expect(result).toEqual({ success: true });
  });

  it("should return error when updateUser fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });
    mockUpdateUser.mockResolvedValue({ error: { message: "email taken" } });

    const { changeEmail } = await import("@/lib/account/actions");
    const result = await changeEmail("new@example.com");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.serverError"));
  });
});

describe("deleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { deleteAccount } = await import("@/lib/account/actions");
    const result = await deleteAccount("削除");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should return error when confirm text is wrong", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });

    const { deleteAccount } = await import("@/lib/account/actions");
    const result = await deleteAccount("wrong");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.invalidInput"));
  });

  it("should delete account successfully", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });

    mockStorage.mockReturnValue({
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
      or: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null }),
      }),
    });
    mockFrom.mockReturnValue({ delete: mockDelete, select: mockSelect });

    const { deleteAccount } = await import("@/lib/account/actions");
    const result = await deleteAccount("削除");

    expect(result).toEqual({ success: true });
  });
});
