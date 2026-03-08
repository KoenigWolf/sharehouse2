"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { CacheStrategy } from "@/lib/utils/cache";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { isValidUUID, AuditEventType, auditLog } from "@/lib/security";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { requireAdmin, clearAdminCache } from "@/lib/admin/check";
import { emailSchema, passwordSchema } from "@/domain/validation/auth";
import type { ActionResponse, ActionResponseWith } from "@/lib/types/action-response";

export interface AdminListProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  room_number: string | null;
  is_admin: boolean;
  move_in_date: string | null;
}

const ADMIN_LIST_COLUMNS = "id, name, avatar_url, room_number, is_admin, move_in_date" as const;

type ServerTranslator = Awaited<ReturnType<typeof getServerTranslator>>;

// --- Shared Helpers ---

/**
 * Originと管理者権限の検証を行う共通ヘルパー
 */
async function requireAdminAndOrigin(t: ServerTranslator, actionName: string): Promise<string | undefined> {
  const originError = await enforceAllowedOrigin(t, actionName);
  if (originError) return originError;

  const adminError = await requireAdmin(t);
  if (adminError) return adminError;

  return undefined;
}

/**
 * 対象UUIDを検証する共通ヘルパー
 */
function validateUUIDOrReturnError(targetUserId: string, t: ServerTranslator): string | undefined {
  if (!isValidUUID(targetUserId)) {
    return t("errors.invalidInput");
  }
  return undefined;
}

/**
 * AdminClientの生成と、失敗時のエラーハンドリングを共通化するヘルパー
 */
async function withAdminClient<R>(
  t: ServerTranslator,
  actionName: string,
  callback: (adminClient: ReturnType<typeof createAdminClient>) => Promise<R | { error: string }>
): Promise<R | { error: string }> {
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (e) {
    logError(e, { action: `${actionName}.createAdminClient` });
    return { error: t("errors.serviceRoleNotConfigured") };
  }
  return callback(adminClient);
}

/**
 * Mutation時のエラーログ記録と統一レスポンスを返す共通ヘルパー
 */
function runAdminMutation(error: unknown, actionName: string, t: ServerTranslator, userId?: string): ActionResponse {
  if (error) {
    logError(error, { action: actionName, userId });
    return { error: t("errors.adminOperationFailed") };
  }
  return { success: true };
}

/**
 * 全ユーザーのプロフィール一覧を取得する（管理者専用）
 * @returns プロフィール配列、エラー時は空配列
 */
export async function getAllProfilesForAdmin(): Promise<AdminListProfile[]> {
  const t = await getServerTranslator();

  const adminError = await requireAdmin(t);
  if (adminError) return [];

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select(ADMIN_LIST_COLUMNS)
      .order("room_number", { ascending: true, nullsFirst: false });

    if (error || !data) {
      if (error) logError(error, { action: "getAllProfilesForAdmin" });
      return [];
    }

    return data as AdminListProfile[];
  } catch (error) {
    logError(error, { action: "getAllProfilesForAdmin" });
    return [];
  }
}

/**
 * 管理者権限をトグルする（管理者専用）
 *
 * 自分自身の権限は変更できない。
 *
 * @param targetUserId - 対象ユーザーのID
 */
export async function toggleAdminStatus(targetUserId: string): Promise<ActionResponse> {
  const t = await getServerTranslator();

  const guardError = await requireAdminAndOrigin(t, "toggleAdminStatus");
  if (guardError) return { error: guardError };

  const uuidError = validateUUIDOrReturnError(targetUserId, t);
  if (uuidError) return { error: uuidError };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: t("errors.unauthorized") };

    // 自分自身の権限変更を防ぐ
    if (user.id === targetUserId) {
      return { error: t("errors.forbidden") };
    }

    const { data: target } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", targetUserId)
      .single();

    if (!target) {
      return { error: t("errors.notFound") };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !target.is_admin, updated_at: new Date().toISOString() })
      .eq("id", targetUserId);

    if (error) {
      logError(error, { action: "toggleAdminStatus", userId: targetUserId });
      return { error: t("errors.saveFailed") };
    }

    // Clear admin cache for the affected user
    clearAdminCache(targetUserId);

    CacheStrategy.afterProfileUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "toggleAdminStatus" });
    return { error: t("errors.serverError") };
  }
}

/**
 * アカウントを削除する（管理者専用）
 *
 * 自分自身のアカウントは削除できない。
 * Storage・DB・Authの全データを削除する。
 *
 * @param targetUserId - 対象ユーザーのID
 */
export async function adminDeleteAccount(targetUserId: string): Promise<ActionResponse> {
  const t = await getServerTranslator();

  const guardError = await requireAdminAndOrigin(t, "adminDeleteAccount");
  if (guardError) return { error: guardError };

  const uuidError = validateUUIDOrReturnError(targetUserId, t);
  if (uuidError) return { error: uuidError };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: t("errors.unauthorized") };

    if (user.id === targetUserId) {
      return { error: t("errors.forbidden") };
    }

    return withAdminClient(t, "adminDeleteAccount", async (adminClient) => {
      // Storage: room-photos
      const { data: roomPhotos } = await adminClient
        .from("room_photos")
        .select("photo_url")
        .eq("user_id", targetUserId);

      if (roomPhotos && roomPhotos.length > 0) {
        const photoPaths = roomPhotos
          .map((p) => p.photo_url?.split("/room-photos/").pop())
          .filter((path): path is string => !!path);
        if (photoPaths.length > 0) {
          const { error: removePhotosError } = await adminClient.storage.from("room-photos").remove(photoPaths);
          if (removePhotosError) {
            logError(removePhotosError, { action: "adminDeleteAccount.removePhotos", userId: targetUserId });
            return { error: t("errors.serverError") };
          }
        }
      }

      // Storage: avatars / cover-photos
      const { data: profile } = await adminClient
        .from("profiles")
        .select("avatar_url, cover_photo_url")
        .eq("id", targetUserId)
        .single();

      if (profile) {
        if (profile.avatar_url?.includes("/avatars/")) {
          const avatarPath = profile.avatar_url.split("/avatars/").pop();
          if (avatarPath) {
            const { error: removeAvatarError } = await adminClient.storage.from("avatars").remove([avatarPath]);
            if (removeAvatarError) {
              logError(removeAvatarError, { action: "adminDeleteAccount.removeAvatar", userId: targetUserId });
              return { error: t("errors.serverError") };
            }
          }
        }

        if (profile.cover_photo_url?.includes("/cover-photos/")) {
          const coverPath = profile.cover_photo_url.split("/cover-photos/").pop();
          if (coverPath) {
            const { error: removeCoverError } = await adminClient.storage.from("cover-photos").remove([coverPath]);
            if (removeCoverError) {
              logError(removeCoverError, { action: "adminDeleteAccount.removeCover", userId: targetUserId });
              return { error: t("errors.serverError") };
            }
          }
        }
      }

      // DB: 関連データ削除
      const relatedResults = await Promise.all([
        adminClient.from("room_photos").delete().eq("user_id", targetUserId),
        adminClient.from("notification_settings").delete().eq("user_id", targetUserId),
        adminClient.from("tea_time_settings").delete().eq("user_id", targetUserId),
        adminClient
          .from("tea_time_matches")
          .delete()
          .or(`user1_id.eq.${targetUserId},user2_id.eq.${targetUserId}`),
      ]);

      const relatedTables = ["room_photos", "notification_settings", "tea_time_settings", "tea_time_matches"];
      for (let i = 0; i < relatedResults.length; i++) {
        if (relatedResults[i].error) {
          logError(relatedResults[i].error, {
            action: `adminDeleteAccount.delete.${relatedTables[i]}`,
            userId: targetUserId,
          });
        }
      }

      // Auth: ユーザー削除（CASCADE で profiles 含む全関連データが削除される）
      const { error: authError } = await adminClient.auth.admin.deleteUser(targetUserId);

      if (authError) {
        return runAdminMutation(authError, "adminDeleteAccount.authDelete", t, targetUserId);
      }

      // 削除の検証
      const { data: remaining } = await adminClient
        .from("profiles")
        .select("id")
        .eq("id", targetUserId)
        .maybeSingle();

      if (remaining) {
        // CASCADE で消えなかった場合、直接削除
        const { error: profileError } = await adminClient
          .from("profiles")
          .delete()
          .eq("id", targetUserId);

        if (profileError) {
          return runAdminMutation(profileError, "adminDeleteAccount.delete.profiles", t, targetUserId);
        }
      }

      CacheStrategy.clearAll();
      revalidatePath("/admin");
      return { success: true };
    });
  } catch (error) {
    logError(error, { action: "adminDeleteAccount" });
    return { error: t("errors.serverError") };
  }
}

/**
 * ユーザーのメールアドレスを Auth から取得する（管理者専用）
 *
 * @param targetUserId - 対象ユーザーのID
 */
export async function adminGetUserEmail(
  targetUserId: string,
): Promise<ActionResponseWith<{ email: string }>> {
  const t = await getServerTranslator();

  const guardError = await requireAdminAndOrigin(t, "adminGetUserEmail");
  if (guardError) return { error: guardError };

  const uuidError = validateUUIDOrReturnError(targetUserId, t);
  if (uuidError) return { error: uuidError };

  try {
    return withAdminClient<{ success: true; email: string }>(t, "adminGetUserEmail", async (adminClient) => {
      const { data, error } = await adminClient.auth.admin.getUserById(targetUserId);

      if (error) {
        logError(error, { action: "adminGetUserEmail.getUserById", userId: targetUserId });
        return { error: error.message || t("errors.adminOperationFailed") };
      }

      if (!data || !data.user) {
        return { error: t("errors.notFound") };
      }

      return { success: true as const, email: data.user.email ?? "" };
    });
  } catch (error) {
    logError(error, { action: "adminGetUserEmail" });
    return { error: t("errors.serverError") };
  }
}

/**
 * ユーザーのメールアドレスを変更する（管理者専用）
 *
 * Admin API を使用するため、対象ユーザーの現パスワード不要。
 *
 * @param targetUserId - 対象ユーザーのID
 * @param newEmail - 新しいメールアドレス
 */
export async function adminUpdateUserEmail(
  targetUserId: string,
  newEmail: string,
): Promise<ActionResponse> {
  const t = await getServerTranslator();

  const guardError = await requireAdminAndOrigin(t, "adminUpdateUserEmail");
  if (guardError) return { error: guardError };

  const uuidError = validateUUIDOrReturnError(targetUserId, t);
  if (uuidError) return { error: uuidError };

  const parsed = emailSchema.safeParse(newEmail);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message;
    return {
      error: msg?.includes(".")
        ? t(msg as Parameters<typeof t>[0])
        : t("errors.invalidInput"),
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: t("errors.unauthorized") };

    if (user.id === targetUserId) {
      return { error: t("errors.forbidden") };
    }

    return withAdminClient(t, "adminUpdateUserEmail", async (adminClient) => {
      const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
        email: parsed.data,
        email_confirm: true,
      });

      if (updateError) {
        return runAdminMutation(updateError, "adminUpdateUserEmail", t, targetUserId);
      }

      auditLog({
        timestamp: new Date().toISOString(),
        eventType: AuditEventType.AUTH_EMAIL_CHANGE,
        userId: user.id,
        action: `Admin changed email for user ${targetUserId}`,
        outcome: "success",
      });

      revalidatePath("/admin");
      return { success: true };
    });
  } catch (error) {
    logError(error, { action: "adminUpdateUserEmail" });
    return { error: t("errors.serverError") };
  }
}

/**
 * ユーザーのパスワードを変更する（管理者専用）
 *
 * Admin API を使用するため、対象ユーザーの現パスワード不要。
 *
 * @param targetUserId - 対象ユーザーのID
 * @param newPassword - 新しいパスワード
 */
export async function adminUpdateUserPassword(
  targetUserId: string,
  newPassword: string,
): Promise<ActionResponse> {
  const t = await getServerTranslator();

  const guardError = await requireAdminAndOrigin(t, "adminUpdateUserPassword");
  if (guardError) return { error: guardError };

  const uuidError = validateUUIDOrReturnError(targetUserId, t);
  if (uuidError) return { error: uuidError };

  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message;
    return {
      error: msg?.includes(".")
        ? t(msg as Parameters<typeof t>[0])
        : t("errors.invalidInput"),
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: t("errors.unauthorized") };

    if (user.id === targetUserId) {
      return { error: t("errors.forbidden") };
    }

    return withAdminClient(t, "adminUpdateUserPassword", async (adminClient) => {
      const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
        password: parsed.data,
      });

      if (updateError) {
        return runAdminMutation(updateError, "adminUpdateUserPassword", t, targetUserId);
      }

      auditLog({
        timestamp: new Date().toISOString(),
        eventType: AuditEventType.AUTH_PASSWORD_CHANGE,
        userId: user.id,
        action: `Admin changed password for user ${targetUserId}`,
        outcome: "success",
      });

      return { success: true };
    });
  } catch (error) {
    logError(error, { action: "adminUpdateUserPassword" });
    return { error: t("errors.serverError") };
  }
}
