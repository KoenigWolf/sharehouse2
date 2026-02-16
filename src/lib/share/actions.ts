"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { SHARE_ITEMS } from "@/lib/constants/config";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { isValidUUID, RateLimiters, formatRateLimitError } from "@/lib/security";
import { validateFileUpload, sanitizeFileName } from "@/domain/validation/profile";
import type { ShareItemWithProfile } from "@/domain/share-item";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Translator } from "@/lib/i18n";

type ActionResponse = { success: true } | { error: string };
type CreateShareItemResponse = { success: true; itemId: string } | { error: string };
type UploadResponse = { success: true; url: string } | { error: string };

type FileValidationResult =
  | { success: true; uint8Array: Uint8Array; fileName: string; contentType: string }
  | { success: false; error: string };

/**
 * Extract storage path from an image URL
 */
function extractStoragePath(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    const marker = "/share-item-images/";
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    const path = pathname.slice(markerIndex + marker.length);
    return path.replace(/^\/+|\/+$/g, "") || null;
  } catch {
    return null;
  }
}

/**
 * Delete an image from storage
 */
async function deleteStorageImage(
  supabase: SupabaseClient,
  imageUrl: string
): Promise<void> {
  const storagePath = extractStoragePath(imageUrl);
  if (storagePath) {
    await supabase.storage.from("share-item-images").remove([storagePath]);
  }
}

/**
 * Validate file from FormData and read its contents
 */
async function validateAndReadFile(
  formData: FormData,
  userId: string,
  itemId: string,
  t: Translator
): Promise<FileValidationResult> {
  const fileEntry = formData.get("image");

  if (!fileEntry || !(fileEntry instanceof File)) {
    return { success: false, error: t("errors.fileRequired") };
  }

  if (fileEntry.size === 0) {
    return { success: false, error: t("errors.fileRequired") };
  }

  const fileValidation = validateFileUpload(
    { size: fileEntry.size, type: fileEntry.type },
    t
  );
  if (!fileValidation.success) {
    return { success: false, error: fileValidation.error ?? t("errors.invalidFileType") };
  }

  const fileExt = fileEntry.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const sanitizedExt = sanitizeFileName(fileExt).slice(0, 10);
  const fileName = `${userId}/${itemId}.${sanitizedExt}`;

  const arrayBuffer = await fileEntry.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  return {
    success: true,
    uint8Array,
    fileName,
    contentType: fileEntry.type,
  };
}

/**
 * Upload image to storage and persist URL to database
 */
async function uploadAndPersistImage(
  supabase: SupabaseClient,
  fileName: string,
  uint8Array: Uint8Array,
  contentType: string,
  itemId: string,
  userId: string,
  t: Translator
): Promise<UploadResponse> {
  const { error: uploadError } = await supabase.storage
    .from("share-item-images")
    .upload(fileName, uint8Array, {
      contentType,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    logError(uploadError, { action: "uploadShareItemImage", userId });
    return { error: t("errors.uploadFailed") };
  }

  const { data: urlData } = supabase.storage
    .from("share-item-images")
    .getPublicUrl(fileName);

  const cacheBuster = Date.now();
  const urlWithCacheBuster = `${urlData.publicUrl}?v=${cacheBuster}`;

  const { error: updateError } = await supabase
    .from("share_items")
    .update({ image_url: urlWithCacheBuster })
    .eq("id", itemId)
    .eq("user_id", userId);

  if (updateError) {
    logError(updateError, { action: "uploadShareItemImage:update", userId });
    await supabase.storage.from("share-item-images").remove([fileName]);
    return { error: t("errors.saveFailed") };
  }

  return { success: true, url: urlWithCacheBuster };
}

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
): Promise<CreateShareItemResponse> {
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

    const { data, error } = await supabase.from("share_items").insert({
      user_id: user.id,
      title: trimmedTitle,
      description: trimmedDesc,
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

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return { error: t("errors.invalidInput") };
    if (trimmedTitle.length > SHARE_ITEMS.maxTitleLength) {
      return { error: t("errors.invalidInput") };
    }

    const trimmedDesc = description?.trim() || null;
    if (trimmedDesc && trimmedDesc.length > SHARE_ITEMS.maxDescriptionLength) {
      return { error: t("errors.invalidInput") };
    }

    const { data, error } = await supabase
      .from("share_items")
      .update({
        title: trimmedTitle,
        description: trimmedDesc,
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

/**
 * Upload share item image
 */
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

    const fileResult = await validateAndReadFile(formData, user.id, itemId, t);
    if (!fileResult.success) {
      return { error: fileResult.error };
    }

    // Save old image URL before upload - we'll delete it only after successful upload
    const oldImageUrl = item.image_url;

    const uploadResult = await uploadAndPersistImage(
      supabase,
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
      await deleteStorageImage(supabase, oldImageUrl);
    }

    CacheStrategy.afterShareUpdate();
    return uploadResult;
  } catch (error) {
    logError(error, { action: "uploadShareItemImage" });
    return { error: t("errors.serverError") };
  }
}
