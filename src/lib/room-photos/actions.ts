"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { validateFileUpload, sanitizeFileName } from "@/domain/validation/profile";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { RateLimiters, formatRateLimitError, isValidUUID } from "@/lib/security";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { extractTakenAt } from "@/lib/utils/exif";
import { ROOM_PHOTOS } from "@/lib/constants/config";
import type { RoomPhoto } from "@/domain/room-photo";
import type { Profile } from "@/domain/profile";

/**
 * Response types
 */
type UpdateResponse = { success: true } | { error: string };
type UploadResponse = { success: true; url: string } | { error: string };
type BulkUploadResponse = { success: true; data: RoomPhoto[] } | { error: string };

export interface BulkPhotoItem {
  storagePath: string;
  takenAt: string | null;
}

/**
 * 部屋の写真をアップロードする
 *
 * オリジン検証 → 認証確認 → レート制限 → ファイルバリデーション →
 * Storage アップロード → DB挿入 → キャッシュ再検証の順に処理。
 *
 * @param formData - "photo" キーにFileを、"caption" キーにキャプション文字列を含むFormData
 * @returns 成功時 `{ success: true, url }`、失敗時 `{ error }`
 */
export async function uploadRoomPhoto(formData: FormData): Promise<UploadResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "uploadRoomPhoto");
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

    const uploadRateLimit = RateLimiters.upload(user.id);
    if (!uploadRateLimit.success) {
      return { error: formatRateLimitError(uploadRateLimit.retryAfter, t) };
    }

    const file = formData.get("photo") as File;
    if (!file || file.size === 0) {
      return { error: t("errors.fileRequired") };
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
    const fileName = `${user.id}/${Date.now()}.${sanitizedExt}`;

    // クライアント側で EXIF 抽出済みなら FormData から受け取る（圧縮後は EXIF 消失）
    const clientTakenAt = (formData.get("takenAt") as string) || null;
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const takenAt = clientTakenAt || (await extractTakenAt(uint8Array));

    const { error: uploadError } = await supabase.storage
      .from("room-photos")
      .upload(fileName, uint8Array, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      logError(uploadError, { action: "uploadRoomPhoto", userId: user.id });
      return { error: `${t("errors.uploadFailed")}: ${uploadError.message}` };
    }

    const { data: urlData } = supabase.storage
      .from("room-photos")
      .getPublicUrl(fileName);

    const caption = (formData.get("caption") as string) || null;

    const { error: insertError } = await supabase.from("room_photos").insert({
      user_id: user.id,
      photo_url: urlData.publicUrl,
      caption,
      taken_at: takenAt,
    });

    if (insertError) {
      logError(insertError, { action: "uploadRoomPhoto.insert", userId: user.id });
      await supabase.storage.from("room-photos").remove([fileName]);
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterRoomPhotoUpdate();
    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    logError(error, { action: "uploadRoomPhoto" });
    return { error: t("errors.serverError") };
  }
}

/**
 * 部屋の写真を削除する
 *
 * オリジン検証 → 認証確認 → UUID検証 → 所有権確認 →
 * Storage削除 → DB削除 → キャッシュ再検証の順に処理。
 *
 * @param photoId - 削除対象の写真ID（UUID）
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function deleteRoomPhoto(photoId: string): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "deleteRoomPhoto");
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

    if (!isValidUUID(photoId)) {
      return { error: t("errors.invalidInput") };
    }

    const { data: photo, error: fetchError } = await supabase
      .from("room_photos")
      .select("*")
      .eq("id", photoId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !photo) {
      return { error: t("errors.notFound") };
    }

    if (photo.photo_url && photo.photo_url.includes("/room-photos/")) {
      const storagePath = photo.photo_url.split("/room-photos/").pop();
      if (storagePath) {
        await supabase.storage.from("room-photos").remove([storagePath]);
      }
    }

    const { error: deleteError } = await supabase
      .from("room_photos")
      .delete()
      .eq("id", photoId)
      .eq("user_id", user.id);

    if (deleteError) {
      logError(deleteError, { action: "deleteRoomPhoto", userId: user.id, metadata: { photoId } });
      return { error: t("errors.deleteFailed") };
    }

    CacheStrategy.afterRoomPhotoUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "deleteRoomPhoto" });
    return { error: t("errors.serverError") };
  }
}

/**
 * 指定ユーザーの部屋写真一覧を取得する
 *
 * @param userId - 対象ユーザーのID
 * @returns 写真一覧（display_order順）、エラー時は空配列
 */
export async function getRoomPhotos(userId: string): Promise<RoomPhoto[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("room_photos")
      .select("*")
      .eq("user_id", userId)
      .order("display_order", { ascending: true });

    if (error || !data) {
      if (error) logError(error, { action: "getRoomPhotos", userId });
      return [];
    }

    return data as RoomPhoto[];
  } catch (error) {
    logError(error, { action: "getRoomPhotos" });
    return [];
  }
}

/**
 * 全ユーザーの部屋写真をプロフィール情報付きで取得する（ギャラリー用）
 *
 * @returns 写真一覧（プロフィール付き、作成日時降順）、エラー時は空配列
 */
export async function getAllRoomPhotos(): Promise<
  (RoomPhoto & { profile: Profile | null })[]
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const [photosResult, profilesResult] = await Promise.all([
      supabase
        .from("room_photos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("profiles")
        .select("id, name, avatar_url"),
    ]);

    if (photosResult.error) {
      logError(photosResult.error, { action: "getAllRoomPhotos" });
      return [];
    }

    const photos = photosResult.data;
    if (!photos || photos.length === 0) {
      return [];
    }

    if (profilesResult.error) {
      logError(profilesResult.error, { action: "getAllRoomPhotos.fetchProfiles" });
    }

    const profiles = profilesResult.data;

    const profileMap = new Map<string, Profile>();
    if (profiles) {
      for (const profile of profiles) {
        profileMap.set(profile.id, profile as Profile);
      }
    }

    return photos.map((photo) => ({
      ...(photo as RoomPhoto),
      profile: profileMap.get(photo.user_id) ?? null,
    }));
  } catch (error) {
    logError(error, { action: "getAllRoomPhotos" });
    return [];
  }
}

/**
 * 部屋の写真キャプションを更新する
 *
 * オリジン検証 → 認証確認 → UUID検証 → 所有権チェック付きUPDATE →
 * キャッシュ再検証の順に処理。
 *
 * @param photoId - 更新対象の写真ID（UUID）
 * @param caption - 新しいキャプション（null で削除）
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function updateRoomPhotoCaption(
  photoId: string,
  caption: string | null
): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "updateRoomPhotoCaption");
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

    if (!isValidUUID(photoId)) {
      return { error: t("errors.invalidInput") };
    }

    const sanitized =
      caption?.trim().slice(0, ROOM_PHOTOS.maxCaptionLength) || null;

    const { data, error } = await supabase
      .from("room_photos")
      .update({ caption: sanitized })
      .eq("id", photoId)
      .eq("user_id", user.id)
      .select("id")
      .single();

    if (error || !data) {
      if (error) {
        logError(error, {
          action: "updateRoomPhotoCaption",
          userId: user.id,
          metadata: { photoId },
        });
      }
      return { error: t("errors.notFound") };
    }

    CacheStrategy.afterRoomPhotoUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "updateRoomPhotoCaption" });
    return { error: t("errors.serverError") };
  }
}

/**
 * 一括アップロードされた写真をDBに登録する
 *
 * クライアントから直接Supabase Storageにアップロード済みのファイルパスと
 * EXIF 撮影日時を受け取り、バッチでDB挿入する。
 *
 * @param items - アップロード済みファイルのパスと撮影日時の配列
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function registerBulkPhotos(
  items: BulkPhotoItem[]
): Promise<BulkUploadResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "registerBulkPhotos");
  if (originError) return { error: originError };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: t("errors.unauthorized") };

    const uploadRateLimit = RateLimiters.upload(user.id);
    if (!uploadRateLimit.success) {
      return { error: formatRateLimitError(uploadRateLimit.retryAfter, t) };
    }

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > ROOM_PHOTOS.maxBulkUpload
    ) {
      return { error: t("errors.invalidInput") };
    }

    const hasInvalidPath = items.some(
      (item) =>
        typeof item.storagePath !== "string" ||
        !item.storagePath.startsWith(`${user.id}/`)
    );
    if (hasInvalidPath) return { error: t("errors.invalidInput") };

    const storagePaths = items.map((item) => item.storagePath);

    const records = items.map((item) => {
      const { data } = supabase.storage
        .from("room-photos")
        .getPublicUrl(item.storagePath);
      return {
        user_id: user.id,
        photo_url: data.publicUrl,
        caption: null,
        taken_at: item.takenAt,
      };
    });

    const { data: insertedData, error: insertError } = await supabase
      .from("room_photos")
      .insert(records)
      .select("*");

    if (insertError) {
      logError(insertError, {
        action: "registerBulkPhotos",
        userId: user.id,
      });
      await supabase.storage.from("room-photos").remove(storagePaths);
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterRoomPhotoUpdate();
    return { success: true, data: insertedData as RoomPhoto[] };
  } catch (error) {
    logError(error, { action: "registerBulkPhotos" });
    return { error: t("errors.serverError") };
  }
}
