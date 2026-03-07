"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { SHARE_ITEMS } from "@/lib/constants/config";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { isValidUUID, RateLimiters, formatRateLimitError } from "@/lib/security";
import { shareItemSchema } from "@/domain/validation/schemas";
import {
  validateAndReadFile,
  uploadAndPersist,
  deleteStorageFile,
  type UploadResponse,
} from "@/lib/utils/storage";
import type { ShareItemWithProfile } from "@/domain/share-item";
import type { ActionResponse, ActionResponseWith } from "@/lib/types/action-response";

const STORAGE_BUCKET = "share-item-images";
const STORAGE_MARKER = `/${STORAGE_BUCKET}/`;
const UPLOAD_CONFIG = {
  bucket: STORAGE_BUCKET,
  table: "share_items",
  idColumn: "id",
  urlColumn: "image_url",
  actionName: "uploadShareItemImage",
} as const;

export async function getShareItems(): Promise<ShareItemWithProfile[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("share_items")
      .select("*, profiles!share_items_user_id_profiles_fk(name, nickname, avatar_url, room_number)")
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
): Promise<ActionResponseWith<{ itemId: string }>> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "createShareItem");
  if (originError) return { error: originError };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const rateLimitResult = RateLimiters.share(user.id);
    if (!rateLimitResult.success) {
      return { error: formatRateLimitError(rateLimitResult.retryAfter, t) };
    }

    const validation = shareItemSchema.safeParse({ title, description, category: "general" });
    if (!validation.success) {
      return { error: validation.error.issues[0].message };
    }
    const validatedData = validation.data;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SHARE_ITEMS.expirationDays);

    const { data, error } = await supabase.from("share_items").insert({
      user_id: user.id,
      title: validatedData.title,
      description: validatedData.description ?? null,
      category: validatedData.category,
      location: validatedData.location ?? null,
      expires_at: expiresAt.toISOString(),
    }).select("id").single();

    if (error || !data) {
      logError(error, { action: "createShareItem", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterShareUpdate();
    return { success: true, itemId: data.id };
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

export async function updateShareItem(
  itemId: string,
  title: string,
  description: string | null
): Promise<ActionResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "updateShareItem");
  if (originError) return { error: originError };

  try {
    if (!isValidUUID(itemId)) return { error: t("errors.invalidIdFormat") };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const validation = shareItemSchema.safeParse({ title, description, category: "general" });
    if (!validation.success) {
      return { error: validation.error.issues[0].message };
    }
    const validatedData = validation.data;

    const { data, error } = await supabase
      .from("share_items")
      .update({
        title: validatedData.title,
        description: validatedData.description ?? null,
        category: validatedData.category,
        location: validatedData.location ?? null,
      })
      .eq("id", itemId)
      .eq("user_id", user.id)
      .select("id")
      .single();

    if (error || !data) {
      if (error) logError(error, { action: "updateShareItem", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterShareUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "updateShareItem" });
    return { error: t("errors.serverError") };
  }
}

export async function uploadShareItemImage(
  itemId: string,
  formData: FormData
): Promise<UploadResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "uploadShareItemImage");
  if (originError) return { error: originError };

  try {
    if (!isValidUUID(itemId)) return { error: t("errors.invalidInput") };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const uploadRateLimit = RateLimiters.upload(user.id);
    if (!uploadRateLimit.success) {
      return { error: formatRateLimitError(uploadRateLimit.retryAfter, t) };
    }

    const { data: item, error: itemError } = await supabase
      .from("share_items")
      .select("id, image_url, user_id")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      logError(itemError ?? new Error("Share item not found"), {
        action: "uploadShareItemImage:findItem",
        userId: user.id,
        metadata: { itemId },
      });
      return { error: t("errors.notFound") };
    }

    if (item.user_id !== user.id) {
      logError(new Error("User is not the item owner"), {
        action: "uploadShareItemImage:ownership",
        userId: user.id,
        metadata: { itemId, itemOwnerId: item.user_id },
      });
      return { error: t("errors.notFound") };
    }

    const fileResult = await validateAndReadFile(formData, "image", user.id, itemId, t);
    if (!fileResult.success) {
      return { error: fileResult.error };
    }

    // Save old image URL before upload - we'll delete it only after successful upload
    const oldImageUrl = item.image_url;

    const uploadResult = await uploadAndPersist(
      supabase,
      UPLOAD_CONFIG,
      fileResult.fileName,
      fileResult.uint8Array,
      fileResult.contentType,
      itemId,
      user.id,
      t
    );

    if ("error" in uploadResult) {
      return uploadResult;
    }

    // Delete old image only after successful upload and DB update
    if (oldImageUrl) {
      await deleteStorageFile(supabase, STORAGE_BUCKET, oldImageUrl, STORAGE_MARKER);
    }

    CacheStrategy.afterShareUpdate();
    return uploadResult;
  } catch (error) {
    logError(error, { action: "uploadShareItemImage" });
    return { error: t("errors.serverError") };
  }
}
