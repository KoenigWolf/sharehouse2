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
    afterGarbageUpdate: vi.fn(),
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

describe("getGarbageSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getGarbageSchedule } = await import("@/lib/garbage/actions");
    const result = await getGarbageSchedule();

    expect(result).toEqual([]);
  });

  it("should return schedule for authenticated user", async () => {
    const mockSchedule = [
      { id: "1", garbage_type: "可燃ごみ", day_of_week: 1, notes: null, display_order: 0 },
      { id: "2", garbage_type: "不燃ごみ", day_of_week: 3, notes: "第1・第3", display_order: 0 },
    ];

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockSchedule, error: null }),
        }),
      }),
    });

    const { getGarbageSchedule } = await import("@/lib/garbage/actions");
    const result = await getGarbageSchedule();

    expect(result).toEqual(mockSchedule);
  });

  it("should return empty array on database error", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
        }),
      }),
    });

    const { getGarbageSchedule } = await import("@/lib/garbage/actions");
    const result = await getGarbageSchedule();

    expect(result).toEqual([]);
  });
});

describe("completeDuty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { completeDuty } = await import("@/lib/garbage/actions");
    const result = await completeDuty("12345678-1234-1234-1234-123456789012");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should reject invalid UUID", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });

    const { completeDuty } = await import("@/lib/garbage/actions");
    const result = await completeDuty("not-a-uuid");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.invalidInput"));
  });

  it("should return error when duty not owned by user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    });

    const { completeDuty } = await import("@/lib/garbage/actions");
    const result = await completeDuty("12345678-1234-1234-1234-123456789012");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should complete duty successfully when owned by user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: "12345678-1234-1234-1234-123456789012" }],
              error: null,
            }),
          }),
        }),
      }),
    });

    const { completeDuty } = await import("@/lib/garbage/actions");
    const result = await completeDuty("12345678-1234-1234-1234-123456789012");

    expect(result).toEqual({ success: true });
  });
});

describe("getUpcomingDuties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getUpcomingDuties } = await import("@/lib/garbage/actions");
    const result = await getUpcomingDuties();

    expect(result).toEqual([]);
  });

  it("should return duties with profiles", async () => {
    const mockDuties = [
      { id: "duty-1", user_id: "user-1", duty_date: "2025-01-29", garbage_type: "可燃ごみ", is_completed: false },
      { id: "duty-2", user_id: "user-2", duty_date: "2025-01-30", garbage_type: "不燃ごみ", is_completed: false },
    ];

    const mockProfiles = [
      { id: "user-1", name: "User 1" },
      { id: "user-2", name: "User 2" },
    ];

    mockGetUser.mockResolvedValue({ data: { user: { id: "current-user" } } });

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockDuties, error: null }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
        }),
      });

    const { getUpcomingDuties } = await import("@/lib/garbage/actions");
    const result = await getUpcomingDuties();

    expect(result).toHaveLength(2);
    expect(result[0].profile?.name).toBe("User 1");
    expect(result[1].profile?.name).toBe("User 2");
  });
});

describe("createGarbageScheduleEntry (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { createGarbageScheduleEntry } = await import("@/lib/garbage/actions");
    const result = await createGarbageScheduleEntry({
      garbage_type: "可燃ごみ",
      day_of_week: 1,
    });

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should return error when user is not admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: false },
            error: null,
          }),
        }),
      }),
    });

    const { createGarbageScheduleEntry } = await import("@/lib/garbage/actions");
    const result = await createGarbageScheduleEntry({
      garbage_type: "可燃ごみ",
      day_of_week: 1,
    });

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.forbidden"));
  });

  it("should reject invalid day_of_week", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-123" } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      }),
    });

    const { createGarbageScheduleEntry } = await import("@/lib/garbage/actions");
    const result = await createGarbageScheduleEntry({
      garbage_type: "可燃ごみ",
      day_of_week: 7,
    });

    expect(result).toHaveProperty("error");
  });

  it("should create schedule entry successfully for admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-123" } } });

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: true },
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

    const { createGarbageScheduleEntry } = await import("@/lib/garbage/actions");
    const result = await createGarbageScheduleEntry({
      garbage_type: "可燃ごみ",
      day_of_week: 1,
      notes: "朝8時までに",
    });

    expect(result).toEqual({ success: true });
  });
});

describe("deleteGarbageScheduleEntry (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject invalid UUID", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-123" } } });

    const { deleteGarbageScheduleEntry } = await import("@/lib/garbage/actions");
    const result = await deleteGarbageScheduleEntry("not-a-uuid");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.invalidInput"));
  });

  it("should delete entry successfully for admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-123" } } });

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: true },
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

    const { deleteGarbageScheduleEntry } = await import("@/lib/garbage/actions");
    const result = await deleteGarbageScheduleEntry("12345678-1234-1234-1234-123456789012");

    expect(result).toEqual({ success: true });
  });
});
