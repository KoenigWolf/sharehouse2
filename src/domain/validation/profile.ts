import { z } from "zod";
import { PROFILE, FILE_UPLOAD } from "@/lib/constants/config";
import { sanitizeForStorage, stripHtml } from "@/lib/security/validation";
import type { TranslationKey, Translator } from "@/lib/i18n";
import { MBTI_TYPES } from "@/domain/profile";

/**
 * Profile validation schemas with security sanitization
 */

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

export const bioSchema = z
  .string()
  .max(PROFILE.bioMaxLength, "validation.bioMaxLength")
  .optional()
  .nullable()
  .transform((val) => {
    if (!val) return null;
    const sanitized = sanitizeForStorage(stripHtml(val));
    return sanitized.length > 0 ? sanitized : null;
  });

export const interestsSchema = z
  .array(z.string().trim())
  .max(20, "validation.interestsMaxCount")
  .default([])
  .transform((arr) =>
    arr
      .map((item) => sanitizeForStorage(stripHtml(item)))
      .filter((item) => item.length > 0 && item.length <= 50)
  );

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

export const mbtiSchema = z
  .enum(MBTI_TYPES, { message: "validation.invalidMBTI" })
  .optional()
  .nullable();

const textFieldSchema = z
  .string()
  .max(100)
  .optional()
  .nullable()
  .transform((val) => {
    if (!val) return null;
    const sanitized = sanitizeForStorage(stripHtml(val.trim()));
    return sanitized.length > 0 ? sanitized : null;
  });

const longTextFieldSchema = z
  .string()
  .max(500)
  .optional()
  .nullable()
  .transform((val) => {
    if (!val) return null;
    const sanitized = sanitizeForStorage(stripHtml(val.trim()));
    return sanitized.length > 0 ? sanitized : null;
  });

const languagesSchema = z
  .array(z.string().trim())
  .max(10)
  .default([])
  .transform((arr) =>
    arr
      .map((item) => sanitizeForStorage(stripHtml(item)))
      .filter((item) => item.length > 0 && item.length <= 50)
  );

const snsUsernameSchema = z
  .string()
  .max(200)
  .optional()
  .nullable()
  .transform((val) => {
    if (!val) return null;
    const trimmed = val.trim();
    if (trimmed.length === 0) return null;
    const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com|instagram\.com|facebook\.com|linkedin\.com\/in|github\.com)\/([a-zA-Z0-9_.-]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }
    const username = trimmed.replace(/^@/, "");
    if (/^[a-zA-Z0-9_.-]+$/.test(username) && username.length <= 50) {
      return username;
    }
    return null;
  });

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
  nickname: textFieldSchema.optional(),
  age_range: textFieldSchema.optional(),
  gender: textFieldSchema.optional(),
  nationality: textFieldSchema.optional(),
  languages: languagesSchema.optional(),
  hometown: textFieldSchema.optional(),
  occupation: textFieldSchema.optional(),
  industry: textFieldSchema.optional(),
  work_location: textFieldSchema.optional(),
  work_style: textFieldSchema.optional(),
  daily_rhythm: textFieldSchema.optional(),
  home_frequency: textFieldSchema.optional(),
  alcohol: textFieldSchema.optional(),
  smoking: textFieldSchema.optional(),
  pets: textFieldSchema.optional(),
  guest_frequency: textFieldSchema.optional(),
  social_stance: textFieldSchema.optional(),
  shared_space_usage: longTextFieldSchema.optional(),
  cleaning_attitude: textFieldSchema.optional(),
  cooking_frequency: textFieldSchema.optional(),
  shared_meals: textFieldSchema.optional(),
  personality_type: textFieldSchema.optional(),
  weekend_activities: longTextFieldSchema.optional(),
  allergies: longTextFieldSchema.optional(),
  sns_x: snsUsernameSchema.optional(),
  sns_instagram: snsUsernameSchema.optional(),
  sns_facebook: snsUsernameSchema.optional(),
  sns_linkedin: snsUsernameSchema.optional(),
  sns_github: snsUsernameSchema.optional(),
});

export const fileUploadSchema = z.object({
  size: z.number().max(FILE_UPLOAD.maxSizeBytes, "validation.fileTooLarge"),
  type: z.enum(FILE_UPLOAD.allowedTypes as unknown as [string, ...string[]], {
    message: "errors.invalidFileType",
  }),
});

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
): { success: true; data: ProfileUpdateInput } | { success: false; error: string } {
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
): { success: true } | { success: false; error: string } {
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

/**
 * File magic bytes for content validation
 * Prevents MIME type spoofing by checking actual file content
 */
const FILE_MAGIC_BYTES: Record<string, { bytes: number[]; offset?: number }[]> = {
  "image/jpeg": [
    { bytes: [0xFF, 0xD8, 0xFF] }, // JPEG SOI marker
  ],
  "image/png": [
    { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }, // PNG signature
  ],
  "image/webp": [
    { bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header (WebP container)
  ],
  "image/gif": [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
};

/**
 * Validate file content matches declared MIME type
 * Checks magic bytes at the start of file content
 *
 * @param content - File content as Uint8Array
 * @param declaredType - Declared MIME type to validate against
 * @returns true if content matches declared type
 */
export function validateFileMagicBytes(
  content: Uint8Array,
  declaredType: string
): boolean {
  const signatures = FILE_MAGIC_BYTES[declaredType];
  if (!signatures) {
    // Unknown type - cannot validate, reject by default
    return false;
  }

  return signatures.some((sig) => {
    const offset = sig.offset ?? 0;
    if (content.length < offset + sig.bytes.length) {
      return false;
    }
    return sig.bytes.every((byte, i) => content[offset + i] === byte);
  });
}

/**
 * Additional WebP validation (check WEBP signature after RIFF)
 */
export function validateWebPContent(content: Uint8Array): boolean {
  if (content.length < 12) return false;

  // Check RIFF header
  if (content[0] !== 0x52 || content[1] !== 0x49 ||
      content[2] !== 0x46 || content[3] !== 0x46) {
    return false;
  }

  // Check WEBP signature at offset 8
  if (content[8] !== 0x57 || content[9] !== 0x45 ||
      content[10] !== 0x42 || content[11] !== 0x50) {
    return false;
  }

  return true;
}

/**
 * Comprehensive file content validation
 * Validates both magic bytes and additional format-specific checks
 */
export function validateFileContent(
  content: Uint8Array,
  declaredType: string,
  t: Translator
): { success: true } | { success: false; error: string } {
  // Check basic magic bytes
  if (!validateFileMagicBytes(content, declaredType)) {
    return { success: false, error: t("errors.invalidFileContent") };
  }

  // Additional WebP validation
  if (declaredType === "image/webp" && !validateWebPContent(content)) {
    return { success: false, error: t("errors.invalidFileContent") };
  }

  // Check for embedded scripts (basic detection)
  const textDecoder = new TextDecoder("utf-8", { fatal: false });
  const textContent = textDecoder.decode(content.slice(0, 1000));
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /<\?php/i,
    /<%/,
  ];

  if (dangerousPatterns.some((pattern) => pattern.test(textContent))) {
    return { success: false, error: t("errors.invalidFileContent") };
  }

  return { success: true };
}
