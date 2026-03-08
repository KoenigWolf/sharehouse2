"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { garbageScheduleSchema, garbageDutySchema } from "@/domain/validation/garbage";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { isValidUUID } from "@/lib/security";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { requireAdmin } from "@/lib/admin/check";
import { toDateString, getDateRange } from "@/lib/utils/formatting";
import { fetchProfileMap } from "@/lib/utils/server-helpers";
import type { ActionResponse, ActionResponseWith } from "@/lib/types/action-response";
import type {
  GarbageSchedule,
  GarbageDuty,
  GarbageDutyWithProfile,
  GarbageScheduleInput,
  GarbageDutyInput,
} from "@/domain/garbage";
import type { Profile } from "@/domain/profile";

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
      .select("id, garbage_type, day_of_week, notes, display_order, created_at, updated_at")
      .order("day_of_week", { ascending: true })
      .order("display_order", { ascending: true });

    if (error || !data) {
      if (error) logError(error, { action: "getGarbageSchedule", userId: user.id });
      return [];
    }

    return data as GarbageSchedule[];
  } catch (error) {
    logError(error, { action: "getGarbageSchedule" });
    return [];
  }
}

export async function getUpcomingDuties(days = 7): Promise<GarbageDutyWithProfile[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { start: today, end: endDateStr } = getDateRange(days);

    const { data: duties, error } = await supabase
      .from("garbage_duties")
      .select("id, user_id, duty_date, garbage_type, is_completed, created_at")
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

    const profileMap = await fetchProfileMap<Profile>(
      supabase,
      duties.map((duty) => duty.user_id)
    );

    return duties.map((duty) => ({
      ...duty,
      profile: profileMap.get(duty.user_id) ?? null,
    })) as GarbageDutyWithProfile[];
  } catch (error) {
    logError(error, { action: "getUpcomingDuties" });
    return [];
  }
}

export async function getMyDuties(): Promise<GarbageDuty[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const today = toDateString();

    const { data, error } = await supabase
      .from("garbage_duties")
      .select("id, user_id, duty_date, garbage_type, is_completed, created_at")
      .eq("user_id", user.id)
      .gte("duty_date", today)
      .order("duty_date", { ascending: true });

    if (error || !data) {
      if (error) logError(error, { action: "getMyDuties", userId: user.id });
      return [];
    }

    return data as GarbageDuty[];
  } catch (error) {
    logError(error, { action: "getMyDuties" });
    return [];
  }
}

export async function createGarbageScheduleEntry(data: GarbageScheduleInput): Promise<ActionResponse> {
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

export async function updateGarbageScheduleEntry(id: string, data: GarbageScheduleInput): Promise<ActionResponse> {
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

export async function deleteGarbageScheduleEntry(id: string): Promise<ActionResponse> {
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

export async function assignDuty(data: GarbageDutyInput): Promise<ActionResponse> {
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

/** 住民を room_number 順にラウンドロビンで当番割り当て */
export async function generateDutyRotation(startDate: string, weeks: number): Promise<ActionResponseWith<{ count: number }>> {
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
      .select("id, room_number")
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
      .select("day_of_week, garbage_type")
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
          const dateStr = toDateString(currentDate);
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

export async function completeDuty(dutyId: string): Promise<ActionResponse> {
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

    // Ownership check + update in a single query
    const { data: updated, error } = await supabase
      .from("garbage_duties")
      .update({ is_completed: true })
      .eq("id", dutyId)
      .eq("user_id", user.id)
      .select("id");

    if (!error && (!updated || updated.length === 0)) {
      return { error: t("errors.unauthorized") };
    }

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
