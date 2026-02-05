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
import { RateLimiters, formatRateLimitError, isValidUUID } from "@/lib/security";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { requireAdmin } from "@/lib/admin/check";

/**
 * Response types
 */
type UpdateResponse = { success: true } | { error: string };
type UploadResponse = { success: true; url: string } | { error: string };

/**
 * ログインユーザーのプロフィールを更新する
 *
 * オリジン検証 → バリデーション → 認証確認 → DB更新 → キャッシュ再検証の順に処理。
 *
 * @param data - 更新するプロフィールデータ（名前・部屋番号・自己紹介・趣味・MBTI・入居日）
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function updateProfile(
  data: ProfileUpdateInput,
  targetUserId?: string
): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "updateProfile");
  if (originError) {
    return { error: originError };
  }

  if (targetUserId && !isValidUUID(targetUserId)) {
    return { error: t("errors.invalidInput") };
  }

  const validation = validateProfileUpdate(data, t);
  if (!validation.success) {
    return { error: validation.error };
  }

  const validatedData = validation.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    // 他人のプロフィール更新は管理者のみ
    const effectiveId = targetUserId && targetUserId !== user.id
      ? targetUserId
      : user.id;

    if (effectiveId !== user.id) {
      const adminError = await requireAdmin(t);
      if (adminError) return { error: adminError };
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
        nickname: validatedData.nickname,
        age_range: validatedData.age_range,
        gender: validatedData.gender,
        nationality: validatedData.nationality,
        languages: validatedData.languages,
        hometown: validatedData.hometown,
        occupation: validatedData.occupation,
        industry: validatedData.industry,
        work_location: validatedData.work_location,
        work_style: validatedData.work_style,
        daily_rhythm: validatedData.daily_rhythm,
        home_frequency: validatedData.home_frequency,
        alcohol: validatedData.alcohol,
        smoking: validatedData.smoking,
        pets: validatedData.pets,
        guest_frequency: validatedData.guest_frequency,
        social_stance: validatedData.social_stance,
        shared_space_usage: validatedData.shared_space_usage,
        cleaning_attitude: validatedData.cleaning_attitude,
        cooking_frequency: validatedData.cooking_frequency,
        shared_meals: validatedData.shared_meals,
        personality_type: validatedData.personality_type,
        weekend_activities: validatedData.weekend_activities,
        allergies: validatedData.allergies,
        sns_x: validatedData.sns_x,
        sns_instagram: validatedData.sns_instagram,
        sns_facebook: validatedData.sns_facebook,
        sns_linkedin: validatedData.sns_linkedin,
        sns_github: validatedData.sns_github,
        updated_at: new Date().toISOString(),
      })
      .eq("id", effectiveId);

    if (error) {
      logError(error, { action: "updateProfile", userId: effectiveId });
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
 * アバター画像をアップロードする
 *
 * レート制限 → ファイルバリデーション → 旧アバター削除 → Storage アップロード →
 * プロフィールURL更新 → キャッシュ再検証の順に処理。
 * 対応形式: JPEG, PNG, WebP
 *
 * @param formData - "avatar" キーにFileを含むFormData
 * @returns 成功時 `{ success: true, url }` （公開URL付き）、失敗時 `{ error }`
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

    // 管理者が他人のアバターを更新する場合
    const targetUserId = formData.get("targetUserId") as string | null;
    if (targetUserId && !isValidUUID(targetUserId)) {
      return { error: t("errors.invalidInput") };
    }

    const effectiveId = targetUserId && targetUserId !== user.id
      ? targetUserId
      : user.id;

    if (effectiveId !== user.id) {
      const adminError = await requireAdmin(t);
      if (adminError) return { error: adminError };
    }

    const uploadRateLimit = RateLimiters.upload(user.id);
    if (!uploadRateLimit.success) {
      return { error: formatRateLimitError(uploadRateLimit.retryAfter, t) };
    }

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

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const sanitizedExt = sanitizeFileName(fileExt).slice(0, 10);
    const fileName = `${effectiveId}-${Date.now()}.${sanitizedExt}`;

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", effectiveId)
      .single();

    if (profile?.avatar_url && profile.avatar_url.includes("/avatars/")) {
      const oldFileName = profile.avatar_url.split("/avatars/").pop();
      if (oldFileName) {
        await supabase.storage.from("avatars").remove([oldFileName]);
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, uint8Array, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      logError(uploadError, { action: "uploadAvatar", userId: effectiveId });
      return { error: `${t("errors.uploadFailed")}: ${uploadError.message}` };
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", effectiveId);

    if (updateError) {
      logError(updateError, { action: "uploadAvatar.updateProfile", userId: effectiveId });
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
 * ログインユーザー自身のプロフィールを取得する
 *
 * @returns プロフィールデータ、未認証またはエラー時は null
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
 * ログインユーザーの新規プロフィールを作成する
 *
 * 既存プロフィールがある場合は何もせず成功を返す。
 * OAuth初回ログイン時のプロフィール自動作成に使用。
 *
 * @param name - ユーザー名
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
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

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existing) {
      return { success: true };
    }

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
