"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { TEA_TIME } from "@/lib/constants/config";
import { logError } from "@/lib/errors";
import { t } from "@/lib/i18n";
import type { Profile } from "@/types/profile";
import type { TeaTimeMatch } from "@/types/tea-time";

/**
 * Response types
 */
type UpdateResponse = { success: true } | { error: string };

/**
 * Build OR filter for user matches (safe from injection)
 * Using PostgREST filter syntax with proper escaping
 */
function buildUserMatchFilter(userId: string): string {
  // Supabase handles escaping, but we validate UUID format first
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    throw new Error("Invalid user ID format");
  }
  return `user1_id.eq.${userId},user2_id.eq.${userId}`;
}

/**
 * Get tea time setting for a user
 */
export async function getTeaTimeSetting(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tea_time_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    // PGRST116 = no rows returned
    if (error && error.code !== "PGRST116") {
      logError(error, { action: "getTeaTimeSetting", userId });
      return null;
    }

    return data;
  } catch (error) {
    logError(error, { action: "getTeaTimeSetting" });
    return null;
  }
}

/**
 * Update tea time participation setting
 */
export async function updateTeaTimeSetting(isEnabled: boolean): Promise<UpdateResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    const { error } = await supabase.from("tea_time_settings").upsert(
      {
        user_id: user.id,
        is_enabled: isEnabled,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      logError(error, { action: "updateTeaTimeSetting", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    revalidatePath("/");
    revalidatePath("/tea-time");
    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    logError(error, { action: "updateTeaTimeSetting" });
    return { error: t("errors.serverError") };
  }
}

/**
 * Get user's match history with partner profiles
 * Optimized to batch-fetch partner profiles instead of N+1 queries
 */
export async function getMyMatches(): Promise<(TeaTimeMatch & { partner: Profile | null })[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    // Get matches for current user
    const { data: matches, error } = await supabase
      .from("tea_time_matches")
      .select("*")
      .or(buildUserMatchFilter(user.id))
      .order("matched_at", { ascending: false })
      .limit(TEA_TIME.maxMatchesDisplay);

    if (error) {
      logError(error, { action: "getMyMatches", userId: user.id });
      return [];
    }

    if (!matches || matches.length === 0) {
      return [];
    }

    // Collect all partner IDs for batch fetching
    const partnerIds = matches.map((match) =>
      match.user1_id === user.id ? match.user2_id : match.user1_id
    );
    const uniquePartnerIds = [...new Set(partnerIds)];

    // Batch fetch all partner profiles
    const { data: partners } = await supabase
      .from("profiles")
      .select("*")
      .in("id", uniquePartnerIds);

    // Create a map for quick lookup
    const partnerMap = new Map<string, Profile>();
    partners?.forEach((partner) => {
      partnerMap.set(partner.id, partner as Profile);
    });

    // Combine matches with partner profiles
    return matches.map((match) => {
      const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;
      return {
        ...match,
        partner: partnerMap.get(partnerId) || null,
      };
    }) as (TeaTimeMatch & { partner: Profile | null })[];
  } catch (error) {
    logError(error, { action: "getMyMatches" });
    return [];
  }
}

/**
 * Update match status
 */
export async function updateMatchStatus(
  matchId: string,
  status: "done" | "skipped"
): Promise<UpdateResponse> {
  // Validate matchId format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(matchId)) {
    return { error: t("errors.invalidInput") };
  }

  // Validate status
  if (!["done", "skipped"].includes(status)) {
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

    // Verify user owns this match before updating
    const { data: match } = await supabase
      .from("tea_time_matches")
      .select("user1_id, user2_id")
      .eq("id", matchId)
      .single();

    if (!match || (match.user1_id !== user.id && match.user2_id !== user.id)) {
      return { error: t("errors.unauthorized") };
    }

    const { error } = await supabase
      .from("tea_time_matches")
      .update({ status })
      .eq("id", matchId);

    if (error) {
      logError(error, { action: "updateMatchStatus", userId: user.id, metadata: { matchId } });
      return { error: t("errors.saveFailed") };
    }

    revalidatePath("/");
    revalidatePath("/tea-time");

    return { success: true };
  } catch (error) {
    logError(error, { action: "updateMatchStatus" });
    return { error: t("errors.serverError") };
  }
}

/**
 * Get latest scheduled match for current user
 */
export async function getLatestScheduledMatch(): Promise<(TeaTimeMatch & { partner: Profile | null }) | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: match, error } = await supabase
      .from("tea_time_matches")
      .select("*")
      .or(buildUserMatchFilter(user.id))
      .eq("status", "scheduled")
      .order("matched_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !match) {
      return null;
    }

    const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;

    const { data: partner } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", partnerId)
      .single();

    return {
      ...match,
      partner: partner as Profile | null,
    };
  } catch (error) {
    logError(error, { action: "getLatestScheduledMatch" });
    return null;
  }
}
