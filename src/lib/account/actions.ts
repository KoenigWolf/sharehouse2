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

type UpdateResponse = { success: true } | { error: string };

/**
 * パスワードを変更する
 *
 * オリジン検証 → 認証確認 → レート制限 → 新パスワードバリデーション →
 * 現パスワード検証（セッション非干渉） → パスワード更新 → 監査ログ
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<UpdateResponse> {
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

    // Cookie に影響を与えない bare client で現パスワードを検証
    const verifyClient = createBareClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: user.email!,
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

/**
 * メールアドレスを変更する
 *
 * オリジン検証 → 認証確認 → レート制限 → メールバリデーション →
 * Supabase に確認メール送信を依頼 → 監査ログ
 */
export async function changeEmail(
  newEmail: string
): Promise<UpdateResponse> {
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

/**
 * アカウントを削除する
 *
 * オリジン検証 → 認証確認 → 確認テキスト検証 → レート制限 →
 * 全ユーザーデータ削除（Storage + DB） → Auth ユーザー削除 → 監査ログ
 */
export async function deleteAccount(
  confirmText: string
): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "deleteAccount");
  if (originError) return { error: originError };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: t("errors.unauthorized") };

    if (confirmText !== "削除") {
      return { error: t("errors.invalidInput") };
    }

    const rateLimit = RateLimiters.passwordReset(user.id);
    if (!rateLimit.success) {
      return { error: formatRateLimitError(rateLimit.retryAfter, t) };
    }

    const userId = user.id;

    // Storage: room-photos バケットからユーザーのファイルを削除
    const { data: photoFiles, error: listPhotosError } = await supabase.storage
      .from("room-photos")
      .list(userId);

    if (listPhotosError) {
      logError(listPhotosError, { action: "deleteAccount.listPhotos", userId });
    } else if (photoFiles && photoFiles.length > 0) {
      const photoPaths = photoFiles.map((f) => `${userId}/${f.name}`);
      const { error: removePhotosError } = await supabase.storage
        .from("room-photos")
        .remove(photoPaths);
      if (removePhotosError) {
        logError(removePhotosError, { action: "deleteAccount.removePhotos", userId });
      }
    }

    // Storage: avatars バケットからプロフィールのアバターを削除
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (profile?.avatar_url && profile.avatar_url.includes("/avatars/")) {
      const avatarPath = profile.avatar_url.split("/avatars/").pop();
      if (avatarPath) {
        const { error: removeAvatarError } = await supabase.storage
          .from("avatars")
          .remove([avatarPath]);
        if (removeAvatarError) {
          logError(removeAvatarError, { action: "deleteAccount.removeAvatar", userId });
        }
      }
    }

    // DB: ユーザー関連データを削除（エラーがあっても続行し、全てログする）
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
      if (deleteResults[i].error) {
        logError(deleteResults[i].error, {
          action: `deleteAccount.delete.${tableNames[i]}`,
          userId,
        });
      }
    }

    // DB: プロフィールを削除
    const { error: profileDeleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      logError(profileDeleteError, { action: "deleteAccount.delete.profiles", userId });
    }

    // Auth: ユーザーを削除（Service Role 必要）
    const adminClient = createAdminClient();
    const { error: deleteError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      logError(deleteError, { action: "deleteAccount.authDelete", userId });
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
