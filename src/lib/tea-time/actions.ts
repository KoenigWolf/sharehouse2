"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * ティータイム参加設定を取得
 */
export async function getTeaTimeSetting(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tea_time_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to get tea time setting:", error);
    return null;
  }

  return data;
}

/**
 * ティータイム参加設定を更新
 */
export async function updateTeaTimeSetting(isEnabled: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("tea_time_settings").upsert(
    {
      user_id: user.id,
      is_enabled: isEnabled,
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    console.error("Failed to update tea time setting:", error);
    return { error: "Failed to update setting" };
  }

  revalidatePath("/");
  revalidatePath("/tea-time");

  return { success: true };
}

/**
 * 自分のマッチ履歴を取得（最新のscheduledマッチを優先）
 */
export async function getMyMatches() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // 自分が関わるマッチを取得
  const { data: matches, error } = await supabase
    .from("tea_time_matches")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order("matched_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Failed to get matches:", error);
    return [];
  }

  // 相手のプロフィール情報を取得
  const matchesWithPartner = await Promise.all(
    (matches || []).map(async (match) => {
      const partnerId =
        match.user1_id === user.id ? match.user2_id : match.user1_id;

      const { data: partner } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", partnerId)
        .single();

      return {
        ...match,
        partner,
      };
    })
  );

  return matchesWithPartner;
}

/**
 * マッチのステータスを更新
 */
export async function updateMatchStatus(
  matchId: string,
  status: "done" | "skipped"
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("tea_time_matches")
    .update({ status })
    .eq("id", matchId);

  if (error) {
    console.error("Failed to update match status:", error);
    return { error: "Failed to update status" };
  }

  revalidatePath("/");
  revalidatePath("/tea-time");

  return { success: true };
}

/**
 * 最新のscheduledマッチを取得
 */
export async function getLatestScheduledMatch() {
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
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("status", "scheduled")
    .order("matched_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !match) {
    return null;
  }

  const partnerId =
    match.user1_id === user.id ? match.user2_id : match.user1_id;

  const { data: partner } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", partnerId)
    .single();

  return {
    ...match,
    partner,
  };
}
