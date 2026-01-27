import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTranslator } from "@/lib/i18n";

// Mock dependencies before importing actions
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockStorage = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    storage: { from: mockStorage },
  })),
}));

vi.mock("@/lib/i18n/server", () => ({
  getServerTranslator: vi.fn(() => createTranslator("ja")),
}));

vi.mock("@/lib/security/request", () => ({
  enforceAllowedOrigin: vi.fn(() => null),
  getRequestIp: vi.fn(() => null),
}));

vi.mock("@/lib/utils/cache", () => ({
  CacheStrategy: {
    afterProfileUpdate: vi.fn(),
    afterAvatarUpdate: vi.fn(),
    afterAuth: vi.fn(),
  },
}));

vi.mock("@/lib/errors", () => ({
  logError: vi.fn(),
}));

vi.mock("@/lib/security", () => ({
  RateLimiters: { upload: vi.fn(() => ({ success: true })) },
  formatRateLimitError: vi.fn(),
}));

const t = createTranslator("ja");

describe("updateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { updateProfile } = await import("@/lib/profile/actions");
    const result = await updateProfile({
      name: "Test",
      room_number: null,
      bio: null,
      interests: [],
      mbti: null,
      move_in_date: null,
    });

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should return error for invalid input (empty name)", async () => {
    const { updateProfile } = await import("@/lib/profile/actions");
    const result = await updateProfile({
      name: "",
      room_number: null,
      bio: null,
      interests: [],
      mbti: null,
      move_in_date: null,
    });

    expect(result).toHaveProperty("error");
  });

  it("should update profile successfully", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const { updateProfile } = await import("@/lib/profile/actions");
    const result = await updateProfile({
      name: "Test User",
      room_number: "301",
      bio: "Hello",
      interests: ["coding"],
      mbti: null,
      move_in_date: null,
    });

    expect(result).toEqual({ success: true });
  });

  it("should return error when database update fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
      }),
    });

    const { updateProfile } = await import("@/lib/profile/actions");
    const result = await updateProfile({
      name: "Test User",
      room_number: null,
      bio: null,
      interests: [],
      mbti: null,
      move_in_date: null,
    });

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.saveFailed"));
  });
});

describe("createProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for empty name", async () => {
    const { createProfile } = await import("@/lib/profile/actions");
    const result = await createProfile("");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("auth.nameRequired"));
  });

  it("should return error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { createProfile } = await import("@/lib/profile/actions");
    const result = await createProfile("Test");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should return success if profile already exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "user-123" } }),
        }),
      }),
    });

    const { createProfile } = await import("@/lib/profile/actions");
    const result = await createProfile("Test");

    expect(result).toEqual({ success: true });
  });

  it("should create new profile when none exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
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

    const { createProfile } = await import("@/lib/profile/actions");
    const result = await createProfile("New User");

    expect(result).toEqual({ success: true });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-123",
        name: "New User",
      })
    );
  });
});
