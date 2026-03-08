"use server";

import { createClient as createBareClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailSchema, passwordSchema } from "@/domain/validation/auth";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import {
  RateLimiters,
  formatRateLimitError,
  AuditEventType,
  auditLog,
} from "@/lib/security";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env";
import type { ActionResponse } from "@/lib/types/action-response";

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ActionResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "changePassword");
  if (originError) return { error: originError };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: t("errors.unauthorized") };

    const rateLimit = RateLimiters.passwordReset(user.id);
    if (!rateLimit.success) {
      return { error: formatRateLimitError(rateLimit.retryAfter, t) };
    }

    if (!currentPassword) {
      return { error: t("errors.invalidInput") };
    }

    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message;
      return { error: msg?.includes(".") ? t(msg as Parameters<typeof t>[0]) : t("errors.invalidInput") };
    }

    if (!user.email) {
      return { error: t("errors.invalidInput") };
    }

    // Cookie に影響を与えない bare client で現パスワードを検証
    const verifyClient = createBareClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return { error: t("account.currentPasswordWrong") };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data,
    });

    if (updateError) {
      logError(updateError, { action: "changePassword", userId: user.id });
      return { error: t("errors.serverError") };
    }

    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.AUTH_PASSWORD_CHANGE,
      userId: user.id,
      action: "Password changed",
      outcome: "success",
    });

    return { success: true };
  } catch (error) {
    logError(error, { action: "changePassword" });
    return { error: t("errors.serverError") };
  }
}

export async function changeEmail(
  newEmail: string
): Promise<ActionResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "changeEmail");
  if (originError) return { error: originError };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: t("errors.unauthorized") };

    const rateLimit = RateLimiters.passwordReset(user.id);
    if (!rateLimit.success) {
      return { error: formatRateLimitError(rateLimit.retryAfter, t) };
    }

    const parsed = emailSchema.safeParse(newEmail);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message;
      return { error: msg?.includes(".") ? t(msg as Parameters<typeof t>[0]) : t("errors.invalidInput") };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      email: parsed.data,
    });

    if (updateError) {
      logError(updateError, { action: "changeEmail", userId: user.id });
      return { error: t("errors.serverError") };
    }

    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.AUTH_EMAIL_CHANGE,
      userId: user.id,
      action: "Email change requested",
      outcome: "success",
    });

    return { success: true };
  } catch (error) {
    logError(error, { action: "changeEmail" });
    return { error: t("errors.serverError") };
  }
}

export async function deleteAccount(
  confirmText: string
): Promise<ActionResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "deleteAccount");
  if (originError) return { error: originError };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: t("errors.unauthorized") };

    if (confirmText !== t("account.deleteConfirmPlaceholder")) {
      return { error: t("errors.invalidInput") };
    }

    const rateLimit = RateLimiters.passwordReset(user.id);
    if (!rateLimit.success) {
      return { error: formatRateLimitError(rateLimit.retryAfter, t) };
    }

    const userId = user.id;

    // The storage API requires collecting all exact paths for deletion.
    // We paginate through the list to avoid partial deletes and then remove them in a subsequent batch operation.
    const BATCH_SIZE = 100;
    const allPhotoPaths = await collectAllPhotoPaths(supabase, "room-photos", userId);

    const removePhotosError = await removePhotosInBatches(supabase, "room-photos", allPhotoPaths, BATCH_SIZE);
    if (removePhotosError) {
      logError(removePhotosError, { action: "deleteAccount.removePhotos", userId });
      return { error: t("errors.serverError") };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (profile?.avatar_url) {
      await removeAvatarIfPresent(supabase, userId, profile.avatar_url);
    }

    await deleteUserRecords(supabase, userId);

    const adminClient = createAdminClient();
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      logError(authDeleteError, { action: "deleteAccount.authDelete", userId });
      return { error: t("errors.serverError") };
    }

    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.AUTH_ACCOUNT_DELETE,
      userId,
      action: "Account deleted",
      outcome: "success",
    });

    return { success: true };
  } catch (error) {
    logError(error, { action: "deleteAccount" });
    return { error: t("errors.serverError") };
  }
}

// --- Helpers for Account Deletion ---

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Storage バケットから指定ユーザーの全ファイルパスを収集する
 * @throws リスト取得エラー時は例外をスロー（呼び出し元で処理を中断させる）
 */
async function collectAllPhotoPaths(supabase: SupabaseClient, bucket: string, userId: string): Promise<string[]> {
  const BATCH_SIZE = 100;
  const allPhotoPaths: string[] = [];
  let offset = 0;

  while (true) {
    const { data: photoFiles, error: listError } = await supabase.storage
      .from(bucket)
      .list(userId, { limit: BATCH_SIZE, offset });

    if (listError) {
      logError(listError, { action: "collectAllPhotoPaths.listPhotos", userId, metadata: { bucket } });
      throw listError;
    }

    if (!photoFiles || photoFiles.length === 0) {
      break;
    }

    for (const f of photoFiles) {
      allPhotoPaths.push(`${userId}/${f.name}`);
    }

    if (photoFiles.length < BATCH_SIZE) {
      break;
    }
    offset += BATCH_SIZE;
  }
  return allPhotoPaths;
}

async function removePhotosInBatches(supabase: SupabaseClient, bucket: string, paths: string[], batchSize: number) {
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const { error: removeError } = await supabase.storage
      .from(bucket)
      .remove(batch);
    if (removeError) {
      return removeError;
    }
  }
  return null;
}

/**
 * アバター画像を Storage から削除する
 * @throws 削除エラー時は例外をスロー
 */
async function removeAvatarIfPresent(supabase: SupabaseClient, userId: string, avatarUrl: string): Promise<void> {
  if (!avatarUrl.includes("/avatars/")) {
    return;
  }

  const avatarPath = avatarUrl.split("/avatars/").pop();
  if (!avatarPath) {
    return;
  }

  const { error: removeError } = await supabase.storage
    .from("avatars")
    .remove([avatarPath]);

  if (removeError) {
    logError(removeError, { action: "deleteAccount.removeAvatar", userId });
    throw removeError;
  }
}

/**
 * ユーザーの関連レコードを全て削除する
 * @throws いずれかの削除でエラーが発生した場合は例外をスロー
 */
async function deleteUserRecords(supabase: SupabaseClient, userId: string): Promise<void> {
  const deleteResults = await Promise.all([
    supabase.from("room_photos").delete().eq("user_id", userId),
    supabase.from("notification_settings").delete().eq("user_id", userId),
    supabase.from("tea_time_settings").delete().eq("user_id", userId),
    supabase
      .from("tea_time_matches")
      .delete()
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
  ]);

  const tableNames = ["room_photos", "notification_settings", "tea_time_settings", "tea_time_matches"];
  for (let i = 0; i < deleteResults.length; i++) {
    const err = deleteResults[i].error;
    if (err) {
      logError(err, {
        action: `deleteAccount.delete.${tableNames[i]}`,
        userId,
      });
      throw err;
    }
  }

  const { error: profileDeleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileDeleteError) {
    logError(profileDeleteError, { action: "deleteAccount.delete.profiles", userId });
    throw profileDeleteError;
  }
}
