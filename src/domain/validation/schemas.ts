import { z } from "zod";
import {
   BULLETIN,
   SHARE_ITEMS,
   EVENTS,
   PROFILE,
} from "@/lib/constants/config";

/**
 * Bulletin Schema
 * Uses BULLETIN.maxMessageLength from config
 */
export const bulletinSchema = z.object({
   message: z.string()
      .min(1, "メッセージを入力してください")
      .max(BULLETIN.maxMessageLength, `メッセージは${BULLETIN.maxMessageLength}文字以内で入力してください`),
});

/**
 * Event Schema
 * Uses EVENTS.maxDescriptionLength from config
 */
export const eventSchema = z.object({
   title: z.string()
      .min(1, "タイトルを入力してください")
      .max(EVENTS.maxTitleLength, `タイトルは${EVENTS.maxTitleLength}文字以内で入力してください`),
   description: z.string()
      .max(EVENTS.maxDescriptionLength, `説明は${EVENTS.maxDescriptionLength}文字以内で入力してください`)
      .optional()
      .nullable(),
   event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "正しい日付形式で入力してください (YYYY-MM-DD)"),
   event_time: z.string()
      .max(20, "時間は20文字以内で入力してください")
      .optional()
      .nullable()
      .transform((val) => val?.trim() || null),
   location: z.string()
      .max(200, "場所は200文字以内で入力してください")
      .optional()
      .nullable(),
   max_attendees: z.number().int().min(1).max(100).optional(),
});

/**
 * Share Item Schema
 * Uses SHARE_ITEMS.maxTitleLength and maxDescriptionLength from config
 */
export const shareItemSchema = z.object({
   title: z.string()
      .min(1, "タイトルを入力してください")
      .max(SHARE_ITEMS.maxTitleLength, `タイトルは${SHARE_ITEMS.maxTitleLength}文字以内で入力してください`),
   description: z.string()
      .max(SHARE_ITEMS.maxDescriptionLength, `説明は${SHARE_ITEMS.maxDescriptionLength}文字以内で入力してください`)
      .optional()
      .nullable(),
   category: z.string().optional().default("general"),
   location: z.string()
      .max(100, "保管場所は100文字以内で入力してください")
      .optional()
      .nullable(),
});

/**
 * Profile Schema (Partial/Update)
 * Uses PROFILE constants from config
 */
export const profileSchema = z.object({
   name: z.string()
      .min(1, "名前を入力してください")
      .max(PROFILE.nameMaxLength, `名前は${PROFILE.nameMaxLength}文字以内で入力してください`),
   nickname: z.string()
      .max(50, "ニックネームは50文字以内で入力してください")
      .optional()
      .nullable(),
   room_number: z.string()
      .max(PROFILE.roomNumberMaxLength, `部屋番号は${PROFILE.roomNumberMaxLength}文字以内で入力してください`)
      .optional()
      .nullable(),
   bio: z.string()
      .max(PROFILE.bioMaxLength, `自己紹介は${PROFILE.bioMaxLength}文字以内で入力してください`)
      .optional()
      .nullable(),
   mbti: z.string()
      .length(4, "MBTIは4文字で入力してください")
      .optional()
      .nullable(),
});

export type BulletinInput = z.infer<typeof bulletinSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type ShareItemInput = z.infer<typeof shareItemSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
