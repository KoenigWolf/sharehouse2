"use server";

import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { BULLETIN } from "@/lib/constants/config";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { enforceAllowedOrigin } from "@/lib/security/request";
import type { BulletinWithProfile } from "@/domain/bulletin";

type ActionResponse = { success: true } | { error: string };

/**
 * 全ての投稿を取得（/bulletin ページ用、Twitter型）
 */
export async function getBulletins(): Promise<BulletinWithProfile[]> {
  await connection();

  try {
    const supabase = await createClient();

    const bulletinsRes = await supabase
      .from("bulletins")
      .select("id, user_id, message, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(BULLETIN.maxDisplayOnBulletinPage);

    if (bulletinsRes.error) {
      logError(bulletinsRes.error, { action: "getBulletins:bulletins" });
      return [];
    }

    const bulletins = bulletinsRes.data ?? [];
    if (bulletins.length === 0) {
      return [];
    }

    const userIds = [...new Set(bulletins.map((b) => b.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, nickname, avatar_url, room_number")
      .in("id", userIds);

    if (profilesError) {
      logError(profilesError, { action: "getBulletins:profiles" });
    }

    const profilesMap = new Map(
      (profiles ?? []).map((p) => [p.id, p])
    );

    return bulletins.map((bulletin) => ({
      ...bulletin,
      profiles: profilesMap.get(bulletin.user_id) ?? null,
    })) as BulletinWithProfile[];
  } catch (error) {
    logError(error, { action: "getBulletins" });
    return [];
  }
}

/**
 * 各ユーザーの最新投稿のみ取得（/residents ページ用、上書き型）
 * 
 * DB側で DISTINCT ON により重複排除済み
 */
export async function getLatestBulletinPerUser(): Promise<Map<string, { message: string; updated_at: string }>> {
  await connection();

  try {
    const supabase = await createClient();

    // 各ユーザーの最新投稿1件のみを返す
    const { data, error } = await supabase
      .from("latest_bulletins_per_user")
      .select("user_id, message, updated_at");

    if (error) {
      logError(error, { action: "getLatestBulletinPerUser" });
      return new Map();
    }

    const latestByUser = new Map<string, { message: string; updated_at: string }>();
    for (const bulletin of data ?? []) {
      latestByUser.set(bulletin.user_id, {
        message: bulletin.message,
        updated_at: bulletin.updated_at,
      });
    }

    return latestByUser;
  } catch (error) {
    logError(error, { action: "getLatestBulletinPerUser" });
    return new Map();
  }
}

/**
 * 新規投稿を作成（Twitter型：積み重ね）
 */
export async function createBulletin(message: string): Promise<ActionResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "createBulletin");
  if (originError) return { error: originError };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const trimmed = message.trim();
    if (!trimmed) return { error: t("errors.invalidInput") };
    if (trimmed.length > BULLETIN.maxMessageLength) {
      return { error: t("errors.invalidInput") };
    }

    const { data, error } = await supabase
      .from("bulletins")
      .insert({
        user_id: user.id,
        message: trimmed,
      })
      .select("id")
      .single();

    if (error || !data) {
      logError(error ?? new Error("No data returned from insert"), {
        action: "createBulletin",
        userId: user.id,
      });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterBulletinUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "createBulletin" });
    return { error: t("errors.serverError") };
  }
}

/**
 * 投稿を削除（自分の投稿のみ削除可能）
 */
export async function deleteBulletin(bulletinId: string): Promise<ActionResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "deleteBulletin");
  if (originError) return { error: originError };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };


    const { data, error } = await supabase
      .from("bulletins")
      .delete()
      .eq("id", bulletinId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      logError(error, { action: "deleteBulletin", userId: user.id, metadata: { bulletinId } });
      return { error: t("errors.deleteFailed") };
    }


    if (!data) {
      logError(new Error("Bulletin not found or not owned by user"), {
        action: "deleteBulletin:notFound",
        userId: user.id,
        metadata: { bulletinId },
      });
      return { error: t("errors.deleteFailed") };
    }

    CacheStrategy.afterBulletinUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "deleteBulletin" });
    return { error: t("errors.serverError") };
  }
}
