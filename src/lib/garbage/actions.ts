"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { garbageScheduleSchema, garbageDutySchema } from "@/domain/validation/garbage";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { isValidUUID } from "@/lib/security";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { requireAdmin } from "@/lib/admin/check";
import type {
  GarbageSchedule,
  GarbageDuty,
  GarbageDutyWithProfile,
  GarbageScheduleInput,
  GarbageDutyInput,
} from "@/domain/garbage";
import type { Profile } from "@/domain/profile";

/**
 * Response types
 */
type UpdateResponse = { success: true } | { error: string };
type GenerateResponse = { success: true; count: number } | { error: string };

/**
 * ゴミ出しスケジュール（曜日別）を全件取得する
 *
 * day_of_week, display_order の昇順でソートして返す。
 * 認証済みユーザーのみアクセス可能。
 *
 * @returns スケジュールの配列、エラー時は空配列
 */
export async function getGarbageSchedule(): Promise<GarbageSchedule[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("garbage_schedule")
      .select("*")
      .order("day_of_week", { ascending: true })
      .order("display_order", { ascending: true });

    if (error) {
      logError(error, { action: "getGarbageSchedule", userId: user.id });
      return [];
    }

    return (data as GarbageSchedule[]) ?? [];
  } catch (error) {
    logError(error, { action: "getGarbageSchedule" });
    return [];
  }
}

/**
 * 直近のゴミ出し当番をプロフィール付きで取得する
 *
 * N+1問題を回避するため、ユーザーIDを集約しバッチ取得する。
 *
 * @param days - 取得する日数（デフォルト: 7日）
 * @returns 当番の配列（プロフィール付き）、エラー時は空配列
 */
export async function getUpcomingDuties(days = 7): Promise<GarbageDutyWithProfile[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const today = new Date().toISOString().split("T")[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    const endDateStr = endDate.toISOString().split("T")[0];

    const { data: duties, error } = await supabase
      .from("garbage_duties")
      .select("*")
      .gte("duty_date", today)
      .lte("duty_date", endDateStr)
      .order("duty_date", { ascending: true });

    if (error) {
      logError(error, { action: "getUpcomingDuties", userId: user.id });
      return [];
    }

    if (!duties || duties.length === 0) {
      return [];
    }

    const userIds = [...new Set(duties.map((duty) => duty.user_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    const profileMap = new Map<string, Profile>();
    profiles?.forEach((profile) => {
      profileMap.set(profile.id, profile as Profile);
    });

    return duties.map((duty) => ({
      ...duty,
      profile: profileMap.get(duty.user_id) || null,
    })) as GarbageDutyWithProfile[];
  } catch (error) {
    logError(error, { action: "getUpcomingDuties" });
    return [];
  }
}

/**
 * ログインユーザーの今後のゴミ出し当番を取得する
 *
 * @returns 当番の配列、エラー時は空配列
 */
export async function getMyDuties(): Promise<GarbageDuty[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("garbage_duties")
      .select("*")
      .eq("user_id", user.id)
      .gte("duty_date", today)
      .order("duty_date", { ascending: true });

    if (error) {
      logError(error, { action: "getMyDuties", userId: user.id });
      return [];
    }

    return (data as GarbageDuty[]) ?? [];
  } catch (error) {
    logError(error, { action: "getMyDuties" });
    return [];
  }
}

/**
 * ゴミ出しスケジュールエントリを新規作成する（管理者専用）
 *
 * enforceAllowedOrigin -> 認証チェック -> 管理者権限チェック -> バリデーション -> 挿入
 *
 * @param data - スケジュール入力データ
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function createGarbageScheduleEntry(data: GarbageScheduleInput): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "createGarbageScheduleEntry");
  if (originError) {
    return { error: originError };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    const adminError = await requireAdmin(t);
    if (adminError) {
      return { error: adminError };
    }

    const parsed = garbageScheduleSchema.safeParse(data);
    if (!parsed.success) {
      return { error: t("errors.invalidInput") };
    }

    const { error } = await supabase.from("garbage_schedule").insert(parsed.data);

    if (error) {
      logError(error, { action: "createGarbageScheduleEntry", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterGarbageUpdate();

    return { success: true };
  } catch (error) {
    logError(error, { action: "createGarbageScheduleEntry" });
    return { error: t("errors.serverError") };
  }
}

/**
 * ゴミ出しスケジュールエントリを更新する（管理者専用）
 *
 * enforceAllowedOrigin -> 認証チェック -> 管理者権限チェック -> バリデーション -> 更新
 *
 * @param id - 更新対象のスケジュールID（UUID形式）
 * @param data - スケジュール入力データ
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function updateGarbageScheduleEntry(id: string, data: GarbageScheduleInput): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "updateGarbageScheduleEntry");
  if (originError) {
    return { error: originError };
  }

  if (!isValidUUID(id)) {
    return { error: t("errors.invalidInput") };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    const adminError = await requireAdmin(t);
    if (adminError) {
      return { error: adminError };
    }

    const parsed = garbageScheduleSchema.safeParse(data);
    if (!parsed.success) {
      return { error: t("errors.invalidInput") };
    }

    const { error } = await supabase
      .from("garbage_schedule")
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      logError(error, { action: "updateGarbageScheduleEntry", userId: user.id, metadata: { id } });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterGarbageUpdate();

    return { success: true };
  } catch (error) {
    logError(error, { action: "updateGarbageScheduleEntry" });
    return { error: t("errors.serverError") };
  }
}

/**
 * ゴミ出しスケジュールエントリを削除する（管理者専用）
 *
 * enforceAllowedOrigin -> 認証チェック -> 管理者権限チェック -> UUID検証 -> 削除
 *
 * @param id - 削除対象のスケジュールID（UUID形式）
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function deleteGarbageScheduleEntry(id: string): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "deleteGarbageScheduleEntry");
  if (originError) {
    return { error: originError };
  }

  if (!isValidUUID(id)) {
    return { error: t("errors.invalidInput") };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    const adminError = await requireAdmin(t);
    if (adminError) {
      return { error: adminError };
    }

    const { error } = await supabase
      .from("garbage_schedule")
      .delete()
      .eq("id", id);

    if (error) {
      logError(error, { action: "deleteGarbageScheduleEntry", userId: user.id, metadata: { id } });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterGarbageUpdate();

    return { success: true };
  } catch (error) {
    logError(error, { action: "deleteGarbageScheduleEntry" });
    return { error: t("errors.serverError") };
  }
}

/**
 * ゴミ出し当番を割り当てる（管理者専用）
 *
 * enforceAllowedOrigin -> 認証チェック -> 管理者権限チェック -> バリデーション -> 挿入
 *
 * @param data - 当番入力データ
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function assignDuty(data: GarbageDutyInput): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "assignDuty");
  if (originError) {
    return { error: originError };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    const adminError = await requireAdmin(t);
    if (adminError) {
      return { error: adminError };
    }

    const parsed = garbageDutySchema.safeParse(data);
    if (!parsed.success) {
      return { error: t("errors.invalidInput") };
    }

    const { error } = await supabase.from("garbage_duties").insert(parsed.data);

    if (error) {
      logError(error, { action: "assignDuty", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterGarbageUpdate();

    return { success: true };
  } catch (error) {
    logError(error, { action: "assignDuty" });
    return { error: t("errors.serverError") };
  }
}

/**
 * ゴミ出し当番のローテーションを自動生成する（管理者専用）
 *
 * 全住民をroom_number順に取得し、ゴミ出しスケジュールに基づいて
 * 指定期間（週数）分の当番をラウンドロビン方式で割り当てる。
 *
 * @param startDate - ローテーション開始日（YYYY-MM-DD形式）
 * @param weeks - 生成する週数
 * @returns 成功時 `{ success: true, count }` (生成件数)、失敗時 `{ error }`
 */
export async function generateDutyRotation(startDate: string, weeks: number): Promise<GenerateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "generateDutyRotation");
  if (originError) {
    return { error: originError };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    const adminError = await requireAdmin(t);
    if (adminError) {
      return { error: adminError };
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return { error: t("errors.invalidInput") };
    }

    if (weeks < 1 || weeks > 52 || !Number.isInteger(weeks)) {
      return { error: t("errors.invalidInput") };
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("room_number", { ascending: true });

    if (profilesError) {
      logError(profilesError, { action: "generateDutyRotation", userId: user.id });
      return { error: t("errors.serverError") };
    }

    if (!profiles || profiles.length === 0) {
      return { error: t("errors.invalidInput") };
    }

    const { data: schedule, error: scheduleError } = await supabase
      .from("garbage_schedule")
      .select("*")
      .order("day_of_week", { ascending: true })
      .order("display_order", { ascending: true });

    if (scheduleError) {
      logError(scheduleError, { action: "generateDutyRotation", userId: user.id });
      return { error: t("errors.serverError") };
    }

    if (!schedule || schedule.length === 0) {
      return { error: t("errors.invalidInput") };
    }

    const duties: { user_id: string; duty_date: string; garbage_type: string }[] = [];
    let residentIndex = 0;
    const start = new Date(startDate + "T00:00:00");

    for (let week = 0; week < weeks; week++) {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + week * 7 + dayOffset);
        const dayOfWeek = currentDate.getDay();

        const daySchedule = schedule.filter(
          (entry) => entry.day_of_week === dayOfWeek
        );

        for (const entry of daySchedule) {
          const dateStr = currentDate.toISOString().split("T")[0];
          duties.push({
            user_id: (profiles[residentIndex] as Profile).id,
            duty_date: dateStr,
            garbage_type: entry.garbage_type,
          });
          residentIndex = (residentIndex + 1) % profiles.length;
        }
      }
    }

    if (duties.length === 0) {
      return { success: true, count: 0 };
    }

    const { error: insertError } = await supabase
      .from("garbage_duties")
      .insert(duties);

    if (insertError) {
      logError(insertError, { action: "generateDutyRotation", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterGarbageUpdate();

    return { success: true, count: duties.length };
  } catch (error) {
    logError(error, { action: "generateDutyRotation" });
    return { error: t("errors.serverError") };
  }
}

/**
 * 自分のゴミ出し当番を完了にする
 *
 * 所有権チェック（user_id が自分であること）を行った上で更新する。
 *
 * @param dutyId - 対象当番のID（UUID形式）
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function completeDuty(dutyId: string): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "completeDuty");
  if (originError) {
    return { error: originError };
  }

  if (!isValidUUID(dutyId)) {
    return { error: t("errors.invalidInput") };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    const { data: duty } = await supabase
      .from("garbage_duties")
      .select("user_id")
      .eq("id", dutyId)
      .single();

    if (!duty || duty.user_id !== user.id) {
      return { error: t("errors.unauthorized") };
    }

    const { error } = await supabase
      .from("garbage_duties")
      .update({ is_completed: true })
      .eq("id", dutyId);

    if (error) {
      logError(error, { action: "completeDuty", userId: user.id, metadata: { dutyId } });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterGarbageUpdate();

    return { success: true };
  } catch (error) {
    logError(error, { action: "completeDuty" });
    return { error: t("errors.serverError") };
  }
}
