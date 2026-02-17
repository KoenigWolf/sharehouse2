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
    afterShareUpdate: vi.fn(),
  },
}));

vi.mock("@/lib/errors", () => ({
  logError: vi.fn(),
}));

vi.mock("@/lib/security", () => ({
  RateLimiters: {
    upload: vi.fn(() => ({ success: true })),
    share: vi.fn(() => ({ success: true })),
  },
  formatRateLimitError: vi.fn(),
  isValidUUID: vi.fn((id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)),
}));

const t = createTranslator("ja");

describe("getShareItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return share items successfully", async () => {
    const mockItems = [
      { id: "item-1", title: "Test Item", user_id: "user-1" },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
        }),
      }),
    });

    const { getShareItems } = await import("@/lib/share/actions");
    const result = await getShareItems();

    expect(result).toEqual(mockItems);
  });

  it("should return empty array on error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
        }),
      }),
    });

    const { getShareItems } = await import("@/lib/share/actions");
    const result = await getShareItems();

    expect(result).toEqual([]);
  });
});

describe("createShareItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { createShareItem } = await import("@/lib/share/actions");
    const result = await createShareItem("Test Item", null);

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should return error for empty title", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    const { createShareItem } = await import("@/lib/share/actions");
    const result = await createShareItem("", null);

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.invalidInput"));
  });

  it("should create share item successfully", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "new-item-id" },
            error: null,
          }),
        }),
      }),
    });

    const { createShareItem } = await import("@/lib/share/actions");
    const result = await createShareItem("Test Item", "Description");

    expect(result).toEqual({ success: true, itemId: "new-item-id" });
  });

  it("should return error when database insert fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "DB error" },
          }),
        }),
      }),
    });

    const { createShareItem } = await import("@/lib/share/actions");
    const result = await createShareItem("Test Item", null);

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.saveFailed"));
  });
});

describe("claimShareItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for invalid UUID", async () => {
    const { claimShareItem } = await import("@/lib/share/actions");
    const result = await claimShareItem("invalid-id");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.invalidIdFormat"));
  });

  it("should return error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { claimShareItem } = await import("@/lib/share/actions");
    const result = await claimShareItem("12345678-1234-1234-1234-123456789012");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should claim item successfully", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    const { claimShareItem } = await import("@/lib/share/actions");
    const result = await claimShareItem("12345678-1234-1234-1234-123456789012");

    expect(result).toEqual({ success: true });
  });
});

describe("deleteShareItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for invalid UUID", async () => {
    const { deleteShareItem } = await import("@/lib/share/actions");
    const result = await deleteShareItem("invalid-id");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.invalidIdFormat"));
  });

  it("should return error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { deleteShareItem } = await import("@/lib/share/actions");
    const result = await deleteShareItem("12345678-1234-1234-1234-123456789012");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should delete item successfully", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    const { deleteShareItem } = await import("@/lib/share/actions");
    const result = await deleteShareItem("12345678-1234-1234-1234-123456789012");

    expect(result).toEqual({ success: true });
  });

  it("should return error when database delete fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
        }),
      }),
    });

    const { deleteShareItem } = await import("@/lib/share/actions");
    const result = await deleteShareItem("12345678-1234-1234-1234-123456789012");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.deleteFailed"));
  });
});

describe("updateShareItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for invalid UUID", async () => {
    const { updateShareItem } = await import("@/lib/share/actions");
    const result = await updateShareItem("invalid-id", "Title", null);

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.invalidIdFormat"));
  });

  it("should return error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { updateShareItem } = await import("@/lib/share/actions");
    const result = await updateShareItem(
      "12345678-1234-1234-1234-123456789012",
      "Title",
      null
    );

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should return error for empty title", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    const { updateShareItem } = await import("@/lib/share/actions");
    const result = await updateShareItem(
      "12345678-1234-1234-1234-123456789012",
      "",
      null
    );

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.invalidInput"));
  });

  it("should update item successfully", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "12345678-1234-1234-1234-123456789012" },
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    const { updateShareItem } = await import("@/lib/share/actions");
    const result = await updateShareItem(
      "12345678-1234-1234-1234-123456789012",
      "Updated Title",
      "Updated Description"
    );

    expect(result).toEqual({ success: true });
  });
});
