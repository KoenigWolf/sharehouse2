"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { TEA_TIME } from "@/lib/constants/config";
import { logError } from "@/lib/errors";
import { t } from "@/lib/i18n";
import { getServerTranslator } from "@/lib/i18n/server";
import { isValidUUID } from "@/lib/security";
import { fetchProfileMap } from "@/lib/utils/server-helpers";
import type { ActionResponse } from "@/lib/types/action-response";
import type { Profile } from "@/domain/profile";
import type { TeaTimeMatch } from "@/domain/tea-time";
import { enforceAllowedOrigin } from "@/lib/security/request";

function buildUserMatchFilter(userId: string): string {
  // SQLインジェクション防止のためUUID形式を検証
  if (!isValidUUID(userId)) {
    throw new Error(t("errors.invalidIdFormat"));
  }
  return `user1_id.eq.${userId},user2_id.eq.${userId}`;
}

export async function getTeaTimeSetting(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tea_time_settings")
      .select("user_id, is_enabled, preferred_time, created_at, updated_at")
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

export async function updateTeaTimeSetting(isEnabled: boolean): Promise<ActionResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "updateTeaTimeSetting");
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

    CacheStrategy.afterTeaTimeUpdate();

    return { success: true };
  } catch (error) {
    logError(error, { action: "updateTeaTimeSetting" });
    return { error: t("errors.serverError") };
  }
}

export async function getMyMatches(): Promise<(TeaTimeMatch & { partner: Profile | null })[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data: matches, error } = await supabase
      .from("tea_time_matches")
      .select("id, user1_id, user2_id, matched_at, status, created_at")
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

    const partnerIds = matches.map((match) =>
      match.user1_id === user.id ? match.user2_id : match.user1_id
    );
    const partnerMap = await fetchProfileMap<Profile>(supabase, partnerIds);

    return matches.map((match) => {
      const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;
      return {
        ...match,
        partner: partnerMap.get(partnerId) ?? null,
      };
    }) as (TeaTimeMatch & { partner: Profile | null })[];
  } catch (error) {
    logError(error, { action: "getMyMatches" });
    return [];
  }
}

export async function updateMatchStatus(
  matchId: string,
  status: "done" | "skipped"
): Promise<ActionResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "updateMatchStatus");
  if (originError) {
    return { error: originError };
  }

  // Validate matchId format
  if (!isValidUUID(matchId)) {
    return { error: t("errors.invalidInput") };
  }

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

    CacheStrategy.afterMatchUpdate();

    return { success: true };
  } catch (error) {
    logError(error, { action: "updateMatchStatus" });
    return { error: t("errors.serverError") };
  }
}

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
      .select("id, user1_id, user2_id, matched_at, status, created_at")
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
      .select("id, name, avatar_url")
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
