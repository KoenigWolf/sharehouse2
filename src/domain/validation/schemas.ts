import { z } from "zod";

/**
 * Common validation patterns
 */
export const commonSchemas = {
   message: z.string().min(1, "メッセージを入力してください").max(1000, "メッセージは1000文字以内で入力してください"),
   title: z.string().min(1, "タイトルを入力してください").max(100, "タイトルは100文字以内で入力してください"),
   description: z.string().max(2000, "説明は2000文字以内で入力してください").optional().nullable(),
   date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "正しい日付形式で入力してください (YYYY-MM-DD)"),
};

/**
 * Bulletin Schema
 */
export const bulletinSchema = z.object({
   message: commonSchemas.message,
});

/**
 * Event Schema
 */
export const eventSchema = z.object({
   title: commonSchemas.title,
   description: commonSchemas.description,
   event_date: commonSchemas.date,
   location: z.string().max(200, "場所は200文字以内で入力してください").optional(),
   max_attendees: z.number().int().min(1).max(100).optional(),
});

/**
 * Share Item Schema
 */
export const shareItemSchema = z.object({
   title: commonSchemas.title,
   description: commonSchemas.description,
   category: z.string().optional().default("general"),
   location: z.string().max(100, "保管場所を入力してください").optional(),
});

/**
 * Profile Schema (Partial/Update)
 */
export const profileSchema = z.object({
   name: z.string().min(1, "名前を入力してください").max(50, "名前は50文字以内で入力してください"),
   nickname: z.string().max(50, "ニックネームは50文字以内で入力してください").optional().nullable(),
   room_number: z.string().max(10, "部屋番号は10文字以内で入力してください").optional().nullable(),
   bio: z.string().max(500, "自己紹介は500文字以内で入力してください").optional().nullable(),
   mbti: z.string().length(4, "MBTIは4文字で入力してください").optional().nullable(),
});

export type BulletinInput = z.infer<typeof bulletinSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type ShareItemInput = z.infer<typeof shareItemSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
