"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import {
  validateProfileUpdate,
  validateFileUpload,
  sanitizeFileName,
  type ProfileUpdateInput,
} from "@/domain/validation/profile";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { RateLimiters, formatRateLimitError } from "@/lib/security";
import { enforceAllowedOrigin } from "@/lib/security/request";

/**
 * Response types
 */
type UpdateResponse = { success: true } | { error: string };
type UploadResponse = { success: true; url: string } | { error: string };

/**
 * Update user profile
 */
export async function updateProfile(data: ProfileUpdateInput): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "updateProfile");
  if (originError) {
    return { error: originError };
  }

  const validation = validateProfileUpdate(data, t);
  if (!validation.success) {
    return { error: validation.error || t("errors.invalidInput") };
  }

  const validatedData = validation.data!;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: validatedData.name,
        room_number: validatedData.room_number,
        bio: validatedData.bio,
        interests: validatedData.interests,
        mbti: validatedData.mbti,
        move_in_date: validatedData.move_in_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      logError(error, { action: "updateProfile", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterProfileUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "updateProfile" });
    return { error: t("errors.serverError") };
  }
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(formData: FormData): Promise<UploadResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "uploadAvatar");
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

    const file = formData.get("avatar") as File;
    if (!file || file.size === 0) {
      return { error: t("errors.fileRequired") };
    }

    const uploadRateLimit = RateLimiters.upload(user.id);
    if (!uploadRateLimit.success) {
      return { error: formatRateLimitError(uploadRateLimit.retryAfter, t) };
    }

    // Validate file
    const fileValidation = validateFileUpload(
      {
      size: file.size,
      type: file.type,
    },
      t
    );
    if (!fileValidation.success) {
      return { error: fileValidation.error || t("errors.invalidFileType") };
    }

    // Generate safe filename
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const sanitizedExt = sanitizeFileName(fileExt).slice(0, 10);
    const fileName = `${user.id}-${Date.now()}.${sanitizedExt}`;

    // Delete existing avatar
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (profile?.avatar_url && profile.avatar_url.includes("/avatars/")) {
      const oldFileName = profile.avatar_url.split("/avatars/").pop();
      if (oldFileName) {
        await supabase.storage.from("avatars").remove([oldFileName]);
      }
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, uint8Array, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      logError(uploadError, { action: "uploadAvatar", userId: user.id });
      return { error: `${t("errors.uploadFailed")}: ${uploadError.message}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      logError(updateError, { action: "uploadAvatar.updateProfile", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterAvatarUpdate();
    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    logError(error, { action: "uploadAvatar" });
    return { error: t("errors.serverError") };
  }
}

/**
 * Get current user's profile
 */
export async function getMyProfile() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      logError(error, { action: "getMyProfile", userId: user.id });
      return null;
    }

    return data;
  } catch (error) {
    logError(error, { action: "getMyProfile" });
    return null;
  }
}

/**
 * Create a new profile for the current user
 */
export async function createProfile(name: string): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "createProfile");
  if (originError) {
    return { error: originError };
  }

  if (!name?.trim()) {
    return { error: t("auth.nameRequired") };
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    // Check for existing profile
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existing) {
      return { success: true };
    }

    // Create new profile
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      name: name.trim(),
      room_number: null,
      bio: null,
      avatar_url: null,
      interests: [],
      mbti: null,
      move_in_date: null,
    });

    if (error) {
      logError(error, { action: "createProfile", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterAuth();
    return { success: true };
  } catch (error) {
    logError(error, { action: "createProfile" });
    return { error: t("errors.serverError") };
  }
}
