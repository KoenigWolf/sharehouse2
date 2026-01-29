"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { TEA_TIME } from "@/lib/constants/config";
import { logError } from "@/lib/errors";
import { t } from "@/lib/i18n";
import { getServerTranslator } from "@/lib/i18n/server";
import { isValidUUID } from "@/lib/security";
import type { Profile } from "@/domain/profile";
import type { TeaTimeMatch } from "@/domain/tea-time";
import { enforceAllowedOrigin } from "@/lib/security/request";

/**
 * Response types
 */
type UpdateResponse = { success: true } | { error: string };

/**
 * ユーザーのマッチを検索するためのPostgREST ORフィルタを生成する
 *
 * user1_id または user2_id に一致するレコードを検索する。
 * SQLインジェクション防止のためUUID形式をバリデーションする。
 *
 * @param userId - 検索対象のユーザーID（UUID形式）
 * @returns PostgREST用フィルタ文字列
 * @throws UUID形式が不正な場合
 */
function buildUserMatchFilter(userId: string): string {
  // Validate UUID format to prevent injection
  if (!isValidUUID(userId)) {
    throw new Error(t("errors.invalidIdFormat"));
  }
  return `user1_id.eq.${userId},user2_id.eq.${userId}`;
}

/**
 * ユーザーのティータイム参加設定を取得する
 *
 * @param userId - 対象ユーザーのID
 * @returns 設定データ、未設定またはエラー時は null
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
 * ティータイム参加設定を更新する（upsert）
 *
 * @param isEnabled - 参加を有効にするか
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function updateTeaTimeSetting(isEnabled: boolean): Promise<UpdateResponse> {
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

/**
 * ログインユーザーのマッチ履歴をパートナープロフィール付きで取得する
 *
 * N+1問題を回避するため、パートナーIDを集約しバッチ取得する。
 * 表示上限は TEA_TIME.maxMatchesDisplay で制御。
 *
 * @returns マッチ履歴の配列（パートナープロフィール付き）、エラー時は空配列
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

    const partnerIds = matches.map((match) =>
      match.user1_id === user.id ? match.user2_id : match.user1_id
    );
    const uniquePartnerIds = [...new Set(partnerIds)];

    const { data: partners } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .in("id", uniquePartnerIds);

    const partnerMap = new Map<string, Profile>();
    partners?.forEach((partner) => {
      partnerMap.set(partner.id, partner as Profile);
    });

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
 * マッチのステータスを更新する
 *
 * 所有権チェック（user1_id or user2_id が自分であること）を行った上で更新する。
 *
 * @param matchId - 対象マッチのID（UUID形式）
 * @param status - 新しいステータス（"done" | "skipped"）
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function updateMatchStatus(
  matchId: string,
  status: "done" | "skipped"
): Promise<UpdateResponse> {
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

/**
 * ログインユーザーの最新の予定マッチを取得する
 *
 * status="scheduled" のマッチのうち最新1件をパートナープロフィール付きで返す。
 *
 * @returns 予定マッチ（パートナープロフィール付き）、なければ null
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
