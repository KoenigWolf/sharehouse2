import { z } from "zod";
import { PROFILE, FILE_UPLOAD } from "@/lib/constants/config";
import { sanitizeForStorage, stripHtml } from "@/lib/security/validation";
import type { TranslationKey, Translator } from "@/lib/i18n";
import { MBTI_TYPES } from "@/domain/profile";

/**
 * Profile validation schemas with security sanitization
 */

// Room number validation - strict alphanumeric only
export const roomNumberSchema = z
  .string()
  .max(PROFILE.roomNumberMaxLength, "validation.roomNumberMaxLength")
  .regex(/^[0-9A-Za-z-]*$/, "validation.roomNumberFormat")
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
  .max(PROFILE.bioMaxLength, "validation.bioMaxLength")
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
  .max(20, "validation.interestsMaxCount")
  .default([])
  .transform((arr) =>
    arr
      .map((item) => sanitizeForStorage(stripHtml(item)))
      .filter((item) => item.length > 0 && item.length <= 50)
  );

// Move-in date validation
export const moveInDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "validation.dateFormat")
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: "validation.dateInvalid" }
  );

// MBTI validation
export const mbtiSchema = z
  .enum(MBTI_TYPES, { message: "validation.invalidMBTI" })
  .optional()
  .nullable();

// Profile update schema with comprehensive sanitization
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "auth.nameRequired")
    .max(PROFILE.nameMaxLength, "validation.nameMaxLength")
    .transform((val) => sanitizeForStorage(stripHtml(val.trim()))),
  room_number: roomNumberSchema,
  bio: bioSchema,
  interests: interestsSchema,
  mbti: mbtiSchema,
  move_in_date: moveInDateSchema,
});

// File upload validation
export const fileUploadSchema = z.object({
  size: z.number().max(FILE_UPLOAD.maxSizeBytes, "validation.fileTooLarge"),
  type: z.enum(FILE_UPLOAD.allowedTypes as unknown as [string, ...string[]], {
    message: "errors.invalidFileType",
  }),
});

// Type exports
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;

const VALIDATION_PARAMS: Partial<Record<TranslationKey, Record<string, number>>> = {
  "validation.nameMaxLength": { max: PROFILE.nameMaxLength },
  "validation.roomNumberMaxLength": { max: PROFILE.roomNumberMaxLength },
  "validation.bioMaxLength": { max: PROFILE.bioMaxLength },
  "validation.fileTooLarge": { max: FILE_UPLOAD.maxSizeMB },
};

function formatValidationError(
  issue: z.ZodIssue,
  t: Translator
): string {
  const key = issue.message as TranslationKey;
  if (!key.includes(".")) {
    return t("errors.invalidInput");
  }
  const params = VALIDATION_PARAMS[key];

  if (params) {
    return t(key, params);
  }

  return t(key);
}

/**
 * Validate profile update input
 */
export function validateProfileUpdate(
  data: unknown,
  t: Translator
): {
  success: boolean;
  data?: ProfileUpdateInput;
  error?: string;
} {
  const result = profileUpdateSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const issue = result.error.issues[0];
  return {
    success: false,
    error: issue ? formatValidationError(issue, t) : t("errors.invalidInput"),
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: { size: number; type: string },
  t: Translator
): {
  success: boolean;
  error?: string;
} {
  const result = fileUploadSchema.safeParse(file);
  if (result.success) {
    return { success: true };
  }
  const issue = result.error.issues[0];
  return {
    success: false,
    error: issue ? formatValidationError(issue, t) : t("errors.invalidInput"),
  };
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
