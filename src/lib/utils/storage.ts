import { validateFileUpload, sanitizeFileName } from "@/domain/validation/profile";
import { logError } from "@/lib/errors";
import type { Translator } from "@/lib/i18n";
import type { SupabaseClient } from "@supabase/supabase-js";

export type FileValidationResult =
  | { success: true; uint8Array: Uint8Array; fileName: string; contentType: string }
  | { success: false; error: string };

/**
 * URL からストレージパスを抽出
 *
 * @param url - ストレージ URL
 * @param marker - バケットマーカー (e.g., "/share-item-images/", "/event-covers/")
 */
export function extractStoragePath(url: string, marker: string): string | null {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    const path = pathname.slice(markerIndex + marker.length);
    return path.replace(/^\/+|\/+$/g, "") || null;
  } catch {
    return null;
  }
}

/**
 * FormData からファイルを検証・読み込み
 *
 * @param formData - フォームデータ
 * @param fieldKey - フォームフィールド名 (e.g., "image", "cover")
 * @param userId - ユーザーID
 * @param resourceId - リソースID
 * @param t - 翻訳関数
 */
export async function validateAndReadFile(
  formData: FormData,
  fieldKey: string,
  userId: string,
  resourceId: string,
  t: Translator
): Promise<FileValidationResult> {
  const fileEntry = formData.get(fieldKey);

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
  const fileName = `${userId}/${resourceId}.${sanitizedExt}`;

  const arrayBuffer = await fileEntry.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  return {
    success: true,
    uint8Array,
    fileName,
    contentType: fileEntry.type,
  };
}

export type UploadResponse = { success: true; url: string } | { error: string };

interface UploadConfig {
  bucket: string;
  table: string;
  idColumn: string;
  urlColumn: string;
  actionName: string;
}

/**
 * ストレージにファイルをアップロードし、DBを更新
 *
 * @param supabase - Supabase クライアント
 * @param config - アップロード設定 (bucket, table, columns, action name)
 * @param fileName - ファイル名
 * @param uint8Array - ファイルデータ
 * @param contentType - Content-Type
 * @param resourceId - リソースID
 * @param userId - ユーザーID
 * @param t - 翻訳関数
 */
export async function uploadAndPersist(
  supabase: SupabaseClient,
  config: UploadConfig,
  fileName: string,
  uint8Array: Uint8Array,
  contentType: string,
  resourceId: string,
  userId: string,
  t: Translator
): Promise<UploadResponse> {
  const { bucket, table, idColumn, urlColumn, actionName } = config;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, uint8Array, {
      contentType,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    logError(uploadError, { action: actionName, userId });
    return { error: t("errors.uploadFailed") };
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
  const cacheBuster = Date.now();
  const urlWithCacheBuster = `${urlData.publicUrl}?v=${cacheBuster}`;

  const { error: updateError } = await supabase
    .from(table)
    .update({ [urlColumn]: urlWithCacheBuster })
    .eq(idColumn, resourceId)
    .eq("user_id", userId);

  if (updateError) {
    logError(updateError, { action: `${actionName}:update`, userId });
    await supabase.storage.from(bucket).remove([fileName]);
    return { error: t("errors.saveFailed") };
  }

  return { success: true, url: urlWithCacheBuster };
}

/**
 * ストレージからファイルを削除
 *
 * @param supabase - Supabase クライアント
 * @param bucket - バケット名
 * @param url - ファイルURL
 * @param marker - バケットマーカー (e.g., "/share-item-images/")
 */
export async function deleteStorageFile(
  supabase: SupabaseClient,
  bucket: string,
  url: string,
  marker: string
): Promise<void> {
  const storagePath = extractStoragePath(url, marker);
  if (storagePath) {
    await supabase.storage.from(bucket).remove([storagePath]);
  }
}
