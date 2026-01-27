import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTranslator } from "@/lib/i18n";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/i18n/server", () => ({
  getServerTranslator: vi.fn(() => createTranslator("ja")),
}));

vi.mock("@/lib/security/request", () => ({
  enforceAllowedOrigin: vi.fn(() => null),
}));

vi.mock("@/lib/utils/cache", () => ({
  CacheStrategy: {
    afterTeaTimeUpdate: vi.fn(),
    afterMatchUpdate: vi.fn(),
  },
}));

vi.mock("@/lib/errors", () => ({
  logError: vi.fn(),
}));

vi.mock("@/lib/security", () => ({
  isValidUUID: vi.fn((id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ),
}));

const t = createTranslator("ja");

describe("updateTeaTimeSetting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { updateTeaTimeSetting } = await import("@/lib/tea-time/actions");
    const result = await updateTeaTimeSetting(true);

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should update setting successfully", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    const { updateTeaTimeSetting } = await import("@/lib/tea-time/actions");
    const result = await updateTeaTimeSetting(true);

    expect(result).toEqual({ success: true });
  });

  it("should return error on database failure", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
    });

    const { updateTeaTimeSetting } = await import("@/lib/tea-time/actions");
    const result = await updateTeaTimeSetting(false);

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.saveFailed"));
  });
});

describe("updateMatchStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject invalid UUID for matchId", async () => {
    const { updateMatchStatus } = await import("@/lib/tea-time/actions");
    const result = await updateMatchStatus("not-a-uuid", "done");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.invalidInput"));
  });

  it("should reject invalid status value", async () => {
    const { updateMatchStatus } = await import("@/lib/tea-time/actions");
    const result = await updateMatchStatus(
      "12345678-1234-1234-1234-123456789012",
      "invalid" as "done"
    );

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.invalidInput"));
  });

  it("should return error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { updateMatchStatus } = await import("@/lib/tea-time/actions");
    const result = await updateMatchStatus(
      "12345678-1234-1234-1234-123456789012",
      "done"
    );

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should reject when user does not own the match", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { user1_id: "other-user", user2_id: "another-user" },
          }),
        }),
      }),
    });

    const { updateMatchStatus } = await import("@/lib/tea-time/actions");
    const result = await updateMatchStatus(
      "12345678-1234-1234-1234-123456789012",
      "done"
    );

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should update match status when user owns the match", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user1_id: "user-123", user2_id: "user-456" },
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        update: mockUpdate,
      });

    const { updateMatchStatus } = await import("@/lib/tea-time/actions");
    const result = await updateMatchStatus(
      "12345678-1234-1234-1234-123456789012",
      "done"
    );

    expect(result).toEqual({ success: true });
  });
});

describe("getTeaTimeSetting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return setting data for valid user", async () => {
    const mockData = { user_id: "user-123", is_enabled: true };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      }),
    });

    const { getTeaTimeSetting } = await import("@/lib/tea-time/actions");
    const result = await getTeaTimeSetting("user-123");

    expect(result).toEqual(mockData);
  });

  it("should return null when no setting exists (PGRST116)", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116", message: "No rows" },
          }),
        }),
      }),
    });

    const { getTeaTimeSetting } = await import("@/lib/tea-time/actions");
    const result = await getTeaTimeSetting("user-123");

    expect(result).toBeNull();
  });
});
