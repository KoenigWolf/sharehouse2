"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { validateFileUpload, sanitizeFileName } from "@/domain/validation/profile";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { RateLimiters, formatRateLimitError, isValidUUID } from "@/lib/security";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { requireAdmin } from "@/lib/admin/check";

type UploadResponse = { success: true; url: string } | { error: string };

/**
 * カバー写真をアップロードする
 *
 * オリジン検証 → 認証確認 → レート制限 → ファイルバリデーション →
 * 旧カバー写真削除 → Storage アップロード → DB更新 → キャッシュ再検証の順に処理。
 *
 * @param formData - "cover" キーにFileを含むFormData
 * @returns 成功時 `{ success: true, url }`、失敗時 `{ error }`
 */
export async function uploadCoverPhoto(formData: FormData): Promise<UploadResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "uploadCoverPhoto");
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

    const file = formData.get("cover") as File;
    if (!file || file.size === 0) {
      return { error: t("errors.fileRequired") };
    }

    // 管理者が他人のカバー写真を更新する場合
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
    const fileName = `${effectiveId}/${Date.now()}.${sanitizedExt}`;

    const { data: profile } = await supabase
      .from("profiles")
      .select("cover_photo_url")
      .eq("id", effectiveId)
      .single();

    if (profile?.cover_photo_url && profile.cover_photo_url.includes("/cover-photos/")) {
      const oldFileName = profile.cover_photo_url.split("/cover-photos/").pop();
      if (oldFileName) {
        await supabase.storage.from("cover-photos").remove([oldFileName]);
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("cover-photos")
      .upload(fileName, uint8Array, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      logError(uploadError, { action: "uploadCoverPhoto", userId: effectiveId });
      return { error: `${t("errors.uploadFailed")}: ${uploadError.message}` };
    }

    const { data: urlData } = supabase.storage
      .from("cover-photos")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        cover_photo_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", effectiveId);

    if (updateError) {
      logError(updateError, { action: "uploadCoverPhoto.updateProfile", userId: effectiveId });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterCoverPhotoUpdate();
    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    logError(error, { action: "uploadCoverPhoto" });
    return { error: t("errors.serverError") };
  }
}
