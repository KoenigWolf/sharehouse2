import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTranslator } from "@/lib/i18n";

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
}));

vi.mock("@/lib/utils/cache", () => ({
  CacheStrategy: {
    afterRoomPhotoUpdate: vi.fn(),
  },
}));

vi.mock("@/lib/errors", () => ({
  logError: vi.fn(),
}));

vi.mock("@/lib/security", () => ({
  isValidUUID: vi.fn((id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ),
  RateLimiters: {
    upload: vi.fn(() => ({ success: true })),
  },
  formatRateLimitError: vi.fn(() => "Rate limit exceeded"),
}));

vi.mock("@/domain/validation/profile", () => ({
  validateFileUpload: vi.fn(() => ({ success: true })),
  sanitizeFileName: vi.fn((name: string) => name.replace(/[^a-z0-9.]/gi, "")),
}));

const t = createTranslator("ja");

describe("getRoomPhotos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getRoomPhotos } = await import("@/lib/room-photos/actions");
    const result = await getRoomPhotos("user-123");

    expect(result).toEqual([]);
  });

  it("should return photos for authenticated user", async () => {
    const mockPhotos = [
      { id: "photo-1", user_id: "user-123", photo_url: "url1", caption: null, display_order: 0 },
      { id: "photo-2", user_id: "user-123", photo_url: "url2", caption: "test", display_order: 1 },
    ];

    mockGetUser.mockResolvedValue({ data: { user: { id: "current-user" } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockPhotos, error: null }),
        }),
      }),
    });

    const { getRoomPhotos } = await import("@/lib/room-photos/actions");
    const result = await getRoomPhotos("user-123");

    expect(result).toEqual(mockPhotos);
  });

  it("should return empty array on database error", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "current-user" } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
        }),
      }),
    });

    const { getRoomPhotos } = await import("@/lib/room-photos/actions");
    const result = await getRoomPhotos("user-123");

    expect(result).toEqual([]);
  });
});

describe("deleteRoomPhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { deleteRoomPhoto } = await import("@/lib/room-photos/actions");
    const result = await deleteRoomPhoto("12345678-1234-1234-1234-123456789012");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.unauthorized"));
  });

  it("should reject invalid UUID", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });

    const { deleteRoomPhoto } = await import("@/lib/room-photos/actions");
    const result = await deleteRoomPhoto("not-a-uuid");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.invalidInput"));
  });

  it("should return error when photo not found or not owned", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    const { deleteRoomPhoto } = await import("@/lib/room-photos/actions");
    const result = await deleteRoomPhoto("12345678-1234-1234-1234-123456789012");

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe(t("errors.notFound"));
  });

  it("should delete photo successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });

    const mockPhoto = {
      id: "12345678-1234-1234-1234-123456789012",
      user_id: "user-123",
      photo_url: "https://example.com/room-photos/user-123/photo.jpg",
    };

    const mockRemove = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPhoto, error: null }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        delete: mockDelete,
      });

    mockStorage.mockReturnValue({
      remove: mockRemove,
    });

    const { deleteRoomPhoto } = await import("@/lib/room-photos/actions");
    const result = await deleteRoomPhoto("12345678-1234-1234-1234-123456789012");

    expect(result).toEqual({ success: true });
  });
});

describe("getAllRoomPhotos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getAllRoomPhotos } = await import("@/lib/room-photos/actions");
    const result = await getAllRoomPhotos();

    expect(result).toEqual([]);
  });

  it("should return photos with profiles", async () => {
    const mockPhotos = [
      { id: "photo-1", user_id: "user-1", photo_url: "url1", caption: null },
      { id: "photo-2", user_id: "user-2", photo_url: "url2", caption: "test" },
    ];

    const mockProfiles = [
      { id: "user-1", name: "User 1" },
      { id: "user-2", name: "User 2" },
    ];

    mockGetUser.mockResolvedValue({ data: { user: { id: "current-user" } } });

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockPhotos, error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
        }),
      });

    const { getAllRoomPhotos } = await import("@/lib/room-photos/actions");
    const result = await getAllRoomPhotos();

    expect(result).toHaveLength(2);
    expect(result[0].profile?.name).toBe("User 1");
    expect(result[1].profile?.name).toBe("User 2");
  });
});
