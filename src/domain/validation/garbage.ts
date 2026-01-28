import { z } from "zod";
import { sanitizeForStorage } from "@/lib/security/validation";

export const garbageScheduleSchema = z.object({
  garbage_type: z
    .string()
    .min(1)
    .max(50)
    .transform((val) => sanitizeForStorage(val)),
  day_of_week: z.number().int().min(0).max(6),
  notes: z
    .string()
    .max(200)
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      const sanitized = sanitizeForStorage(val);
      return sanitized.length > 0 ? sanitized : null;
    }),
});

export const garbageDutySchema = z.object({
  user_id: z.string().uuid(),
  duty_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  garbage_type: z
    .string()
    .min(1)
    .max(50)
    .transform((val) => sanitizeForStorage(val)),
});

export type GarbageScheduleValidated = z.infer<typeof garbageScheduleSchema>;
export type GarbageDutyValidated = z.infer<typeof garbageDutySchema>;
