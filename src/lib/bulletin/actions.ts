"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { BULLETIN } from "@/lib/constants/config";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { enforceAllowedOrigin } from "@/lib/security/request";
import type { BulletinWithProfile } from "@/domain/bulletin";

type ActionResponse = { success: true } | { error: string };

export async function getBulletins(): Promise<BulletinWithProfile[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("bulletins")
      .select("*, profiles(name, nickname, avatar_url, room_number)")
      .order("updated_at", { ascending: false })
      .limit(BULLETIN.maxDisplayOnHome);

    if (error) {
      logError(error, { action: "getBulletins" });
      return [];
    }
    return (data as BulletinWithProfile[]) || [];
  } catch (error) {
    logError(error, { action: "getBulletins" });
    return [];
  }
}

export async function upsertBulletin(message: string): Promise<ActionResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "upsertBulletin");
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

    const { error } = await supabase.from("bulletins").upsert(
      {
        user_id: user.id,
        message: trimmed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      logError(error, { action: "upsertBulletin", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterBulletinUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "upsertBulletin" });
    return { error: t("errors.serverError") };
  }
}

export async function deleteBulletin(): Promise<ActionResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "deleteBulletin");
  if (originError) return { error: originError };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const { error } = await supabase
      .from("bulletins")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      logError(error, { action: "deleteBulletin", userId: user.id });
      return { error: t("errors.deleteFailed") };
    }

    CacheStrategy.afterBulletinUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "deleteBulletin" });
    return { error: t("errors.serverError") };
  }
}
