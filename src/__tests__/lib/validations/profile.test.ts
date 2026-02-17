import { describe, it, expect } from "vitest";
import {
  roomNumberSchema,
  bioSchema,
  interestsSchema,
  moveInDateSchema,
  profileUpdateSchema,
  fileUploadSchema,
  validateProfileUpdate,
  validateFileUpload,
  sanitizeFileName,
  validateFileMagicBytes,
  validateWebPContent,
  validateFileContent,
} from "@/domain/validation/profile";
import { PROFILE, FILE_UPLOAD } from "@/lib/constants/config";
import { createTranslator } from "@/lib/i18n";

const t = createTranslator("ja");

describe("roomNumberSchema", () => {
  it("accepts valid room number", () => {
    const result = roomNumberSchema.safeParse("301");
    expect(result.success).toBe(true);
  });

  it("accepts alphanumeric room number", () => {
    const result = roomNumberSchema.safeParse("A-301");
    expect(result.success).toBe(true);
  });

  it("accepts null", () => {
    const result = roomNumberSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it("accepts undefined", () => {
    const result = roomNumberSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it("rejects special characters", () => {
    const result = roomNumberSchema.safeParse("301@#");
    expect(result.success).toBe(false);
  });

  it("rejects room number that exceeds max length", () => {
    const longRoom = "1".repeat(PROFILE.roomNumberMaxLength + 1);
    const result = roomNumberSchema.safeParse(longRoom);
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only string due to regex", () => {
    // Spaces don't match the alphanumeric regex, so validation fails
    const result = roomNumberSchema.safeParse("   ");
    expect(result.success).toBe(false);
  });

  it("transforms empty string to null", () => {
    const result = roomNumberSchema.safeParse("");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });
});

describe("bioSchema", () => {
  it("accepts valid bio", () => {
    const result = bioSchema.safeParse("こんにちは、山田です。");
    expect(result.success).toBe(true);
  });

  it("accepts null", () => {
    const result = bioSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it("accepts undefined", () => {
    const result = bioSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it("rejects bio that exceeds max length", () => {
    const longBio = "あ".repeat(PROFILE.bioMaxLength + 1);
    const result = bioSchema.safeParse(longBio);
    expect(result.success).toBe(false);
  });

  it("trims whitespace and returns null for empty", () => {
    const result = bioSchema.safeParse("   ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });
});

describe("interestsSchema", () => {
  it("accepts valid interests array", () => {
    const result = interestsSchema.safeParse(["料理", "映画", "ランニング"]);
    expect(result.success).toBe(true);
  });

  it("accepts empty array", () => {
    const result = interestsSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("filters out empty strings", () => {
    const result = interestsSchema.safeParse(["料理", "", "映画"]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(["料理", "映画"]);
    }
  });

  it("trims whitespace from interests", () => {
    const result = interestsSchema.safeParse(["  料理  ", "  映画  "]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(["料理", "映画"]);
    }
  });

  it("rejects more than 20 interests", () => {
    const manyInterests = Array(21).fill("趣味");
    const result = interestsSchema.safeParse(manyInterests);
    expect(result.success).toBe(false);
  });

  it("defaults to empty array when undefined", () => {
    const result = interestsSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });
});

describe("moveInDateSchema", () => {
  it("accepts valid date format", () => {
    const result = moveInDateSchema.safeParse("2024-01-15");
    expect(result.success).toBe(true);
  });

  it("accepts null", () => {
    const result = moveInDateSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it("accepts undefined", () => {
    const result = moveInDateSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it("rejects invalid date format", () => {
    const result = moveInDateSchema.safeParse("01-15-2024");
    expect(result.success).toBe(false);
  });

  it("rejects invalid date", () => {
    const result = moveInDateSchema.safeParse("2024-13-45");
    expect(result.success).toBe(false);
  });

  it("rejects date string with time", () => {
    const result = moveInDateSchema.safeParse("2024-01-15T10:00:00");
    expect(result.success).toBe(false);
  });
});

describe("profileUpdateSchema", () => {
  const validData = {
    name: "山田 太郎",
    room_number: "301",
    bio: "こんにちは",
    interests: ["料理", "映画"],
    move_in_date: "2024-01-15",
  };

  it("accepts valid profile data", () => {
    const result = profileUpdateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = profileUpdateSchema.safeParse({
      ...validData,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null for optional fields", () => {
    const result = profileUpdateSchema.safeParse({
      name: "山田 太郎",
      room_number: null,
      bio: null,
      interests: [],
      move_in_date: null,
    });
    expect(result.success).toBe(true);
  });

  it("trims name in output", () => {
    const result = profileUpdateSchema.safeParse({
      ...validData,
      name: "  山田 太郎  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("山田 太郎");
    }
  });

  it("accepts extended profile fields", () => {
    const result = profileUpdateSchema.safeParse({
      ...validData,
      nickname: "タロちゃん",
      age_range: "30s",
      gender: "male",
      nationality: "日本",
      languages: ["japanese", "english"],
      hometown: "東京都",
      occupation: "employee",
      industry: "it",
      work_location: "渋谷",
      work_style: "hybrid",
      daily_rhythm: "morning",
      home_frequency: "everyday",
      alcohol: "sometimes",
      smoking: "noSmoke",
      pets: "either",
      guest_frequency: "rarely",
      social_stance: "moderate",
      shared_space_usage: "リビングでよく読書します",
      cleaning_attitude: "moderate",
      cooking_frequency: "fewTimesWeek",
      shared_meals: "sometimes",
      personality_type: "おだやか",
      weekend_activities: "カフェ巡り",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nickname).toBe("タロちゃん");
      expect(result.data.age_range).toBe("30s");
      expect(result.data.languages).toEqual(["japanese", "english"]);
    }
  });

  it("accepts null for extended profile fields", () => {
    const result = profileUpdateSchema.safeParse({
      ...validData,
      nickname: null,
      age_range: null,
      gender: null,
      occupation: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nickname).toBeNull();
      expect(result.data.age_range).toBeNull();
    }
  });

  it("accepts data without extended fields (backward compatible)", () => {
    const result = profileUpdateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("sanitizes extended text fields", () => {
    const result = profileUpdateSchema.safeParse({
      ...validData,
      nickname: "  <script>alert('xss')</script>タロちゃん  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nickname).not.toContain("<script>");
      expect(result.data.nickname).toContain("タロちゃん");
    }
  });

  it("transforms empty extended text fields to null", () => {
    const result = profileUpdateSchema.safeParse({
      ...validData,
      nickname: "   ",
      hometown: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nickname).toBeNull();
      expect(result.data.hometown).toBeNull();
    }
  });

  it("rejects text field exceeding max length", () => {
    const result = profileUpdateSchema.safeParse({
      ...validData,
      nickname: "あ".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts long text field up to 500 chars", () => {
    const result = profileUpdateSchema.safeParse({
      ...validData,
      shared_space_usage: "あ".repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it("rejects long text field exceeding 500 chars", () => {
    const result = profileUpdateSchema.safeParse({
      ...validData,
      shared_space_usage: "あ".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("filters empty strings from languages array", () => {
    const result = profileUpdateSchema.safeParse({
      ...validData,
      languages: ["japanese", "", "english", "  "],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.languages).toEqual(["japanese", "english"]);
    }
  });

  it("limits languages array to 10 items", () => {
    const result = profileUpdateSchema.safeParse({
      ...validData,
      languages: Array(11).fill("japanese"),
    });
    expect(result.success).toBe(false);
  });
});

describe("fileUploadSchema", () => {
  it("accepts valid JPEG file", () => {
    const result = fileUploadSchema.safeParse({
      size: 1024 * 1024,
      type: "image/jpeg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid PNG file", () => {
    const result = fileUploadSchema.safeParse({
      size: 1024 * 1024,
      type: "image/png",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid WebP file", () => {
    const result = fileUploadSchema.safeParse({
      size: 1024 * 1024,
      type: "image/webp",
    });
    expect(result.success).toBe(true);
  });

  it("rejects file that exceeds max size", () => {
    const result = fileUploadSchema.safeParse({
      size: FILE_UPLOAD.maxSizeBytes + 1,
      type: "image/jpeg",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid file type", () => {
    const result = fileUploadSchema.safeParse({
      size: 1024 * 1024,
      type: "image/gif",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-image file type", () => {
    const result = fileUploadSchema.safeParse({
      size: 1024 * 1024,
      type: "application/pdf",
    });
    expect(result.success).toBe(false);
  });
});

describe("validateProfileUpdate", () => {
  it("returns success for valid data", () => {
    const result = validateProfileUpdate({
      name: "山田 太郎",
      room_number: "301",
      bio: "こんにちは",
      interests: ["料理"],
      move_in_date: "2024-01-15",
    }, t);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toBeDefined();
  });

  it("returns error for empty name", () => {
    const result = validateProfileUpdate({
      name: "",
      room_number: "301",
      bio: "こんにちは",
      interests: [],
      move_in_date: null,
    }, t);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeDefined();
  });
});

describe("validateFileUpload", () => {
  it("returns success for valid file", () => {
    const result = validateFileUpload({
      size: 1024 * 1024,
      type: "image/jpeg",
    }, t);
    expect(result.success).toBe(true);
  });

  it("returns error for oversized file", () => {
    const result = validateFileUpload({
      size: FILE_UPLOAD.maxSizeBytes + 1,
      type: "image/jpeg",
    }, t);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeDefined();
  });

  it("returns error for invalid type", () => {
    const result = validateFileUpload({
      size: 1024,
      type: "image/gif",
    }, t);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeDefined();
  });
});

describe("sanitizeFileName", () => {
  it("keeps valid filename unchanged", () => {
    expect(sanitizeFileName("photo.jpg")).toBe("photo.jpg");
  });

  it("keeps alphanumeric characters and allowed symbols", () => {
    expect(sanitizeFileName("my-photo_2024.jpg")).toBe("my-photo_2024.jpg");
  });

  it("removes forward slashes", () => {
    expect(sanitizeFileName("path/to/file.jpg")).toBe("pathtofile.jpg");
  });

  it("removes backslashes", () => {
    expect(sanitizeFileName("path\\to\\file.jpg")).toBe("pathtofile.jpg");
  });

  it("removes path traversal attempts", () => {
    expect(sanitizeFileName("../../../etc/passwd")).toBe("etcpasswd");
  });

  it("replaces special characters with underscores", () => {
    expect(sanitizeFileName("photo@#$%.jpg")).toBe("photo____.jpg");
  });

  it("replaces Japanese characters with underscores", () => {
    expect(sanitizeFileName("写真.jpg")).toBe("__.jpg");
  });

  it("truncates long filenames to 100 characters", () => {
    const longName = "a".repeat(150) + ".jpg";
    const result = sanitizeFileName(longName);
    expect(result.length).toBe(100);
  });

  it("handles empty filename", () => {
    expect(sanitizeFileName("")).toBe("");
  });
});

describe("validateFileMagicBytes", () => {
  it("validates JPEG magic bytes", () => {
    // JPEG starts with FF D8 FF
    const jpegContent = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    expect(validateFileMagicBytes(jpegContent, "image/jpeg")).toBe(true);
  });

  it("validates PNG magic bytes", () => {
    // PNG starts with 89 50 4E 47 0D 0A 1A 0A
    const pngContent = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]);
    expect(validateFileMagicBytes(pngContent, "image/png")).toBe(true);
  });

  it("validates WebP magic bytes (RIFF header)", () => {
    // WebP starts with RIFF
    const webpContent = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00]);
    expect(validateFileMagicBytes(webpContent, "image/webp")).toBe(true);
  });

  it("validates GIF87a magic bytes", () => {
    // GIF87a
    const gifContent = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x00]);
    expect(validateFileMagicBytes(gifContent, "image/gif")).toBe(true);
  });

  it("validates GIF89a magic bytes", () => {
    // GIF89a
    const gifContent = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00]);
    expect(validateFileMagicBytes(gifContent, "image/gif")).toBe(true);
  });

  it("rejects content with wrong magic bytes", () => {
    // Text file pretending to be JPEG
    const textContent = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]); // "Hello"
    expect(validateFileMagicBytes(textContent, "image/jpeg")).toBe(false);
  });

  it("rejects unknown MIME types", () => {
    const content = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    expect(validateFileMagicBytes(content, "application/pdf")).toBe(false);
  });

  it("rejects empty content", () => {
    const emptyContent = new Uint8Array([]);
    expect(validateFileMagicBytes(emptyContent, "image/jpeg")).toBe(false);
  });

  it("rejects content shorter than magic bytes", () => {
    // PNG needs 8 bytes, but we only provide 4
    const shortContent = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
    expect(validateFileMagicBytes(shortContent, "image/png")).toBe(false);
  });
});

describe("validateWebPContent", () => {
  it("validates complete WebP header", () => {
    // RIFF at 0-3, WEBP at 8-11
    const webpContent = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // size
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    expect(validateWebPContent(webpContent)).toBe(true);
  });

  it("rejects content without WEBP signature", () => {
    // RIFF header but not WEBP
    const riffContent = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x41, 0x56, 0x49, 0x20, // AVI instead of WEBP
    ]);
    expect(validateWebPContent(riffContent)).toBe(false);
  });

  it("rejects content without RIFF header", () => {
    const noRiffContent = new Uint8Array([
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
    ]);
    expect(validateWebPContent(noRiffContent)).toBe(false);
  });

  it("rejects content shorter than 12 bytes", () => {
    const shortContent = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00]);
    expect(validateWebPContent(shortContent)).toBe(false);
  });
});

describe("validateFileContent", () => {
  it("accepts valid JPEG content", () => {
    const jpegContent = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    const result = validateFileContent(jpegContent, "image/jpeg", t);
    expect(result.success).toBe(true);
  });

  it("accepts valid PNG content", () => {
    const pngContent = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]);
    const result = validateFileContent(pngContent, "image/png", t);
    expect(result.success).toBe(true);
  });

  it("accepts valid WebP content", () => {
    const webpContent = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    const result = validateFileContent(webpContent, "image/webp", t);
    expect(result.success).toBe(true);
  });

  it("rejects invalid magic bytes", () => {
    const textContent = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]); // "Hello"
    const result = validateFileContent(textContent, "image/jpeg", t);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it("rejects content with embedded script tags", () => {
    // Valid JPEG header but with script tag in content
    const maliciousContent = new Uint8Array([
      0xFF, 0xD8, 0xFF, 0xE0, // JPEG header
      0x3C, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, // <script
      0x3E, // >
    ]);
    const result = validateFileContent(maliciousContent, "image/jpeg", t);
    expect(result.success).toBe(false);
  });

  it("rejects content with javascript: protocol", () => {
    const maliciousContent = new Uint8Array([
      0xFF, 0xD8, 0xFF, 0xE0, // JPEG header
      // "javascript:" encoded as bytes
      0x6A, 0x61, 0x76, 0x61, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x3A,
    ]);
    const result = validateFileContent(maliciousContent, "image/jpeg", t);
    expect(result.success).toBe(false);
  });

  it("rejects content with PHP tags", () => {
    const maliciousContent = new Uint8Array([
      0xFF, 0xD8, 0xFF, 0xE0, // JPEG header
      0x3C, 0x3F, 0x70, 0x68, 0x70, // <?php
    ]);
    const result = validateFileContent(maliciousContent, "image/jpeg", t);
    expect(result.success).toBe(false);
  });
});
