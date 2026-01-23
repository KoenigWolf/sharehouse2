import { z } from "zod";
import { PROFILE, FILE_UPLOAD } from "@/lib/constants/config";
import { sanitizeForStorage, stripHtml } from "@/lib/security/validation";

/**
 * Profile validation schemas with security sanitization
 */

// Room number validation - strict alphanumeric only
export const roomNumberSchema = z
  .string()
  .max(PROFILE.roomNumberMaxLength, `部屋番号は${PROFILE.roomNumberMaxLength}文字以内で入力してください`)
  .regex(/^[0-9A-Za-z-]*$/, "部屋番号には英数字とハイフンのみ使用できます")
  .optional()
  .nullable()
  .transform((val) => {
    if (!val) return null;
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

// Bio validation with HTML stripping and sanitization
export const bioSchema = z
  .string()
  .max(PROFILE.bioMaxLength, `自己紹介は${PROFILE.bioMaxLength}文字以内で入力してください`)
  .optional()
  .nullable()
  .transform((val) => {
    if (!val) return null;
    // Strip HTML tags and sanitize for storage
    const sanitized = sanitizeForStorage(stripHtml(val));
    return sanitized.length > 0 ? sanitized : null;
  });

// Interests validation with sanitization
export const interestsSchema = z
  .array(z.string().trim())
  .max(20, "趣味・関心は20個以内で入力してください")
  .default([])
  .transform((arr) =>
    arr
      .map((item) => sanitizeForStorage(stripHtml(item)))
      .filter((item) => item.length > 0 && item.length <= 50)
  );

// Move-in date validation
export const moveInDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が無効です")
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: "有効な日付を入力してください" }
  );

// Profile update schema with comprehensive sanitization
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "名前を入力してください")
    .max(PROFILE.nameMaxLength, `名前は${PROFILE.nameMaxLength}文字以内で入力してください`)
    .transform((val) => sanitizeForStorage(stripHtml(val.trim()))),
  room_number: roomNumberSchema,
  bio: bioSchema,
  interests: interestsSchema,
  move_in_date: moveInDateSchema,
});

// File upload validation
export const fileUploadSchema = z.object({
  size: z.number().max(FILE_UPLOAD.maxSizeBytes, `ファイルサイズは${FILE_UPLOAD.maxSizeMB}MB以下にしてください`),
  type: z.enum(FILE_UPLOAD.allowedTypes as unknown as [string, ...string[]], {
    message: "JPG、PNG、またはWebP形式の画像をアップロードしてください",
  }),
});

// Type exports
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;

/**
 * Validate profile update input
 */
export function validateProfileUpdate(data: unknown): {
  success: boolean;
  data?: ProfileUpdateInput;
  error?: string;
} {
  const result = profileUpdateSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message || "入力が無効です" };
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: { size: number; type: string }): {
  success: boolean;
  error?: string;
} {
  const result = fileUploadSchema.safeParse(file);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error.issues[0]?.message || "ファイルが無効です" };
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts and special characters
  return fileName
    .replace(/[/\\]/g, "")
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
}
