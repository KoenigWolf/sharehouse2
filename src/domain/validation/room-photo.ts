import { z } from "zod";
import { sanitizeForStorage, stripHtml } from "@/lib/security/validation";

export const roomPhotoCaptionSchema = z
  .string()
  .max(200)
  .optional()
  .nullable()
  .transform((val) => {
    if (!val) return null;
    const sanitized = sanitizeForStorage(stripHtml(val));
    return sanitized.length > 0 ? sanitized : null;
  });

export const roomPhotoUploadSchema = z.object({
  caption: roomPhotoCaptionSchema,
});
