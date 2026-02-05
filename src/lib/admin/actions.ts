"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { CacheStrategy } from "@/lib/utils/cache";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { isValidUUID, AuditEventType, auditLog } from "@/lib/security";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { requireAdmin } from "@/lib/admin/check";
import { emailSchema, passwordSchema } from "@/domain/validation/auth";
import type { Profile } from "@/domain/profile";

type UpdateResponse = { success: true } | { error: string };
type EmailResponse = { success: true; email: string } | { error: string };

/**
 * 全ユーザーのプロフィール一覧を取得する（管理者専用）
 *
 * @returns プロフィール配列、エラー時は空配列
 */
export async function getAllProfilesForAdmin(): Promise<Profile[]> {
  const t = await getServerTranslator();

  const adminError = await requireAdmin(t);
  if (adminError) return [];

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("room_number", { ascending: true, nullsFirst: false });

    if (error || !data) {
      if (error) logError(error, { action: "getAllProfilesForAdmin" });
      return [];
    }

    return data;
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
export async function toggleAdminStatus(targetUserId: string): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "toggleAdminStatus");
  if (originError) return { error: originError };

  const adminError = await requireAdmin(t);
  if (adminError) return { error: adminError };

  if (!isValidUUID(targetUserId)) {
    return { error: t("errors.invalidInput") };
  }

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
export async function adminDeleteAccount(targetUserId: string): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "adminDeleteAccount");
  if (originError) return { error: originError };

  const adminError = await requireAdmin(t);
  if (adminError) return { error: adminError };

  if (!isValidUUID(targetUserId)) {
    return { error: t("errors.invalidInput") };
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

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      return { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" };
    }

    // Storage: room-photos
    const { data: photoFiles } = await adminClient.storage
      .from("room-photos")
      .list(targetUserId);

    if (photoFiles && photoFiles.length > 0) {
      const photoPaths = photoFiles.map((f) => `${targetUserId}/${f.name}`);
      await adminClient.storage.from("room-photos").remove(photoPaths);
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
          await adminClient.storage.from("avatars").remove([avatarPath]);
        }
      }

      if (profile.cover_photo_url?.includes("/cover-photos/")) {
        const coverPath = profile.cover_photo_url.split("/cover-photos/").pop();
        if (coverPath) {
          await adminClient.storage.from("cover-photos").remove([coverPath]);
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
      logError(authError, { action: "adminDeleteAccount.authDelete", userId: targetUserId });
      return { error: `Auth delete failed: ${authError.message}` };
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
        logError(profileError, { action: "adminDeleteAccount.delete.profiles", userId: targetUserId });
        return { error: `Profile delete failed: ${profileError.message}` };
      }
    }

    CacheStrategy.clearAll();
    revalidatePath("/admin");
    return { success: true };
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
): Promise<EmailResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "adminGetUserEmail");
  if (originError) return { error: originError };

  const adminError = await requireAdmin(t);
  if (adminError) return { error: adminError };

  if (!isValidUUID(targetUserId)) {
    return { error: t("errors.invalidInput") };
  }

  try {
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      return { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" };
    }

    const { data, error } =
      await adminClient.auth.admin.getUserById(targetUserId);

    if (error || !data.user) {
      return { error: t("errors.notFound") };
    }

    return { success: true, email: data.user.email ?? "" };
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
): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "adminUpdateUserEmail");
  if (originError) return { error: originError };

  const adminError = await requireAdmin(t);
  if (adminError) return { error: adminError };

  if (!isValidUUID(targetUserId)) {
    return { error: t("errors.invalidInput") };
  }

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

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      return { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" };
    }

    const { error: updateError } =
      await adminClient.auth.admin.updateUserById(targetUserId, {
        email: parsed.data,
        email_confirm: true,
      });

    if (updateError) {
      logError(updateError, {
        action: "adminUpdateUserEmail",
        userId: targetUserId,
      });
      return { error: updateError.message };
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
): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "adminUpdateUserPassword");
  if (originError) return { error: originError };

  const adminError = await requireAdmin(t);
  if (adminError) return { error: adminError };

  if (!isValidUUID(targetUserId)) {
    return { error: t("errors.invalidInput") };
  }

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

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      return { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" };
    }

    const { error: updateError } =
      await adminClient.auth.admin.updateUserById(targetUserId, {
        password: parsed.data,
      });

    if (updateError) {
      logError(updateError, {
        action: "adminUpdateUserPassword",
        userId: targetUserId,
      });
      return { error: updateError.message };
    }

    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.AUTH_PASSWORD_CHANGE,
      userId: user.id,
      action: `Admin changed password for user ${targetUserId}`,
      outcome: "success",
    });

    return { success: true };
  } catch (error) {
    logError(error, { action: "adminUpdateUserPassword" });
    return { error: t("errors.serverError") };
  }
}
