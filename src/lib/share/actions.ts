"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { SHARE_ITEMS } from "@/lib/constants/config";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { isValidUUID } from "@/lib/security";
import type { ShareItemWithProfile } from "@/domain/share-item";

type ActionResponse = { success: true } | { error: string };

export async function getShareItems(): Promise<ShareItemWithProfile[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("share_items")
      .select("*, profiles(name, nickname, avatar_url, room_number)")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error || !data) {
      if (error) logError(error, { action: "getShareItems" });
      return [];
    }
    return data as ShareItemWithProfile[];
  } catch (error) {
    logError(error, { action: "getShareItems" });
    return [];
  }
}

export async function createShareItem(
  title: string,
  description: string | null
): Promise<ActionResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "createShareItem");
  if (originError) return { error: originError };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return { error: t("errors.invalidInput") };
    if (trimmedTitle.length > SHARE_ITEMS.maxTitleLength) {
      return { error: t("errors.invalidInput") };
    }

    const trimmedDesc = description?.trim() || null;
    if (trimmedDesc && trimmedDesc.length > SHARE_ITEMS.maxDescriptionLength) {
      return { error: t("errors.invalidInput") };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SHARE_ITEMS.expirationDays);

    const { error } = await supabase.from("share_items").insert({
      user_id: user.id,
      title: trimmedTitle,
      description: trimmedDesc,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      logError(error, { action: "createShareItem", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterShareUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "createShareItem" });
    return { error: t("errors.serverError") };
  }
}

export async function claimShareItem(itemId: string): Promise<ActionResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "claimShareItem");
  if (originError) return { error: originError };

  try {
    if (!isValidUUID(itemId)) return { error: t("errors.invalidIdFormat") };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const { error } = await supabase
      .from("share_items")
      .update({
        status: "claimed",
        claimed_by: user.id,
      })
      .eq("id", itemId)
      .eq("status", "available");

    if (error) {
      logError(error, { action: "claimShareItem", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterShareUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "claimShareItem" });
    return { error: t("errors.serverError") };
  }
}

export async function deleteShareItem(itemId: string): Promise<ActionResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "deleteShareItem");
  if (originError) return { error: originError };

  try {
    if (!isValidUUID(itemId)) return { error: t("errors.invalidIdFormat") };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const { error } = await supabase
      .from("share_items")
      .delete()
      .eq("id", itemId)
      .eq("user_id", user.id);

    if (error) {
      logError(error, { action: "deleteShareItem", userId: user.id });
      return { error: t("errors.deleteFailed") };
    }

    CacheStrategy.afterShareUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "deleteShareItem" });
    return { error: t("errors.serverError") };
  }
}
