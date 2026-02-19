"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import {
  validateSignUp,
  validateSignIn,
  emailSchema,
  validatePasswordResetInput,
} from "@/domain/validation/auth";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import {
  RateLimiters,
  formatRateLimitError,
  AuditActions,
  AuditEventType,
  auditLog,
  checkPasswordBreach,
  BREACH_WARNING_THRESHOLD,
  checkAccountLockout,
  recordFailedLogin,
  recordSuccessfulLogin,
} from "@/lib/security";
import { enforceAllowedOrigin, getRequestIp } from "@/lib/security/request";
import {
  createDefaultProfileData,
  resolveFallbackName,
} from "@/application/auth/profile";

/**
 * Response types for auth actions
 */
type SignUpResponse =
  | { success: true }
  | { success: true; needsEmailConfirmation: true; message: string }
  | { error: string };

type SignInResponse = { success: true } | { error: string };

/**
 * メールとパスワードで新規ユーザーを登録する
 *
 * オリジン検証 → バリデーション → レート制限チェック → Supabase Auth登録 →
 * プロフィール自動作成 → 監査ログ記録の順に処理する。
 * メール確認が必要な場合は needsEmailConfirmation を返す。
 *
 * @param name - ユーザー名
 * @param email - メールアドレス
 * @param password - パスワード
 * @returns 成功時 `{ success: true }` または確認メール送信済み、失敗時 `{ error }`
 */
export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<SignUpResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "signUp");
  if (originError) {
    return { error: originError };
  }

  const validation = validateSignUp({ name, email, password }, t);
  if (!validation.success) {
    return { error: validation.error };
  }

  const {
    name: validatedName,
    email: validatedEmail,
    password: validatedPassword,
  } = validation.data;

  const ipAddress = await getRequestIp();
  const rateLimitKey = ipAddress
    ? `${validatedEmail}:${ipAddress}`
    : validatedEmail;
  const rateLimitResult = RateLimiters.auth(rateLimitKey);
  if (!rateLimitResult.success) {
    AuditActions.rateLimited(validatedEmail, "signUp", ipAddress ?? undefined);
    return { error: formatRateLimitError(rateLimitResult.retryAfter, t) };
  }

  // Check if password has been exposed in data breaches
  const breachResult = await checkPasswordBreach(validatedPassword);
  if (breachResult.breached && breachResult.count && breachResult.count >= BREACH_WARNING_THRESHOLD) {
    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.SECURITY_VALIDATION_FAILURE,
      action: "Signup blocked due to breached password",
      outcome: "failure",
      ipAddress: ipAddress ?? undefined,
      metadata: { breachCount: breachResult.count },
    });
    return { error: t("errors.passwordBreached", { count: breachResult.count.toLocaleString() }) };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: validatedEmail,
      password: validatedPassword,
      options: {
        data: {
          name: validatedName,
        },
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      logError(error, { action: "signUp", metadata: { email: validatedEmail } });

      auditLog({
        timestamp: new Date().toISOString(),
        eventType: AuditEventType.AUTH_SIGNUP,
        action: "User signup failed",
        outcome: "failure",
        errorMessage: error.message,
        metadata: { email: validatedEmail.slice(0, 3) + "***", ipAddress },
      });

      if (error.message.includes("already registered")) {
        return { error: t("auth.emailAlreadyExists") };
      }
      return { error: `${t("auth.signupFailed")}: ${error.message}` };
    }

    if (!data.user) {
      return { error: t("auth.signupFailed") };
    }

    // Supabase returns empty identities when email already exists
    if (data.user.identities?.length === 0) {
      return { error: t("auth.emailAlreadyExists") };
    }

    if (!data.session) {
      auditLog({
        timestamp: new Date().toISOString(),
        eventType: AuditEventType.AUTH_SIGNUP,
        userId: data.user.id,
        action: "User signup - confirmation email sent",
        outcome: "success",
        ipAddress: ipAddress ?? undefined,
      });

      return {
        success: true,
        needsEmailConfirmation: true,
        message: t("auth.confirmationEmailSent"),
      };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert(createDefaultProfileData(data.user.id, validatedName));

    if (profileError) {
      logError(profileError, {
        action: "signUp.createProfile",
        userId: data.user.id,
      });
      // Don't fail signup if profile creation fails - it can be created on login
    }

    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.AUTH_SIGNUP,
      userId: data.user.id,
      action: "User signup completed",
      outcome: "success",
      ipAddress: ipAddress ?? undefined,
    });

    CacheStrategy.afterAuth();
    return { success: true };
  } catch (error) {
    logError(error, { action: "signUp" });
    return { error: t("errors.serverError") };
  }
}

/**
 * メールとパスワードでログインする
 *
 * オリジン検証 → バリデーション → レート制限チェック → Supabase Auth認証 →
 * プロフィール存在確認（なければ自動作成） → 監査ログ記録の順に処理する。
 *
 * @param email - メールアドレス
 * @param password - パスワード
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function signIn(
  email: string,
  password: string
): Promise<SignInResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "signIn");
  if (originError) {
    return { error: originError };
  }

  const validation = validateSignIn({ email, password }, t);
  if (!validation.success) {
    return { error: validation.error };
  }

  const { email: validatedEmail, password: validatedPassword } =
    validation.data;

  const ipAddress = await getRequestIp();

  // Rate limit first to prevent attackers from probing lockout status
  const rateLimitKey = ipAddress
    ? `${validatedEmail}:${ipAddress}`
    : validatedEmail;
  const rateLimitResult = RateLimiters.auth(rateLimitKey);
  if (!rateLimitResult.success) {
    AuditActions.rateLimited(validatedEmail, "signIn", ipAddress ?? undefined);
    return { error: formatRateLimitError(rateLimitResult.retryAfter, t) };
  }

  // Check account lockout after rate limit passes
  const lockoutStatus = checkAccountLockout(validatedEmail, ipAddress ?? undefined);
  if (lockoutStatus.isLocked) {
    // Display at least 1 minute to avoid confusing "0 minutes" message
    return { error: t("errors.accountLocked", { minutes: Math.max(1, lockoutStatus.remainingMinutes) }) };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedEmail,
      password: validatedPassword,
    });

    if (error) {
      logError(error, { action: "signIn", metadata: { email: validatedEmail } });

      // Record failed login attempt for lockout tracking
      const lockout = recordFailedLogin(validatedEmail, ipAddress ?? undefined);

      AuditActions.loginFailure(error.message, ipAddress ?? undefined);

      // If account is now locked, return lockout message
      if (lockout.isLocked) {
        return { error: t("errors.accountLocked", { minutes: Math.max(1, lockout.remainingMinutes) }) };
      }

      return { error: t("auth.invalidCredentials") };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      const userName = resolveFallbackName(data.user, t);

      const { error: profileError } = await supabase
        .from("profiles")
        .insert(createDefaultProfileData(data.user.id, userName));

      if (profileError) {
        logError(profileError, {
          action: "signIn.createProfile",
          userId: data.user.id,
        });
        // Don't fail login if profile creation fails
      }
    }

    // Clear failed login attempts on success
    recordSuccessfulLogin(validatedEmail, ipAddress ?? undefined);

    AuditActions.loginSuccess(data.user.id);

    CacheStrategy.afterAuth();
    return { success: true };
  } catch (error) {
    logError(error, { action: "signIn" });
    return { error: t("errors.serverError") };
  }
}

/**
 * パスワードリセット用のメールを送信する
 *
 * メールアドレスの存在有無に関わらず常に成功を返す（列挙攻撃防止）。
 */
type PasswordResetRequestResponse = { success: true } | { error: string };

export async function requestPasswordReset(
  email: string
): Promise<PasswordResetRequestResponse> {
  const t = await getServerTranslator();
  const startTime = Date.now();

  // Minimum response time to prevent timing attacks (800-1200ms with jitter)
  const MIN_RESPONSE_TIME = 800;
  const JITTER = Math.random() * 400;

  const originError = await enforceAllowedOrigin(t, "requestPasswordReset");
  if (originError) return { error: originError };

  const emailResult = emailSchema.safeParse(email);
  if (!emailResult.success) return { error: t("validation.emailInvalid") };

  const validatedEmail = emailResult.data;
  const ipAddress = await getRequestIp();
  const rateLimitKey = ipAddress
    ? `reset:${validatedEmail}:${ipAddress}`
    : `reset:${validatedEmail}`;
  const rateLimitResult = RateLimiters.passwordReset(rateLimitKey);
  if (!rateLimitResult.success) {
    AuditActions.rateLimited(
      validatedEmail,
      "requestPasswordReset",
      ipAddress ?? undefined
    );
    return { error: formatRateLimitError(rateLimitResult.retryAfter, t) };
  }

  let result: PasswordResetRequestResponse;

  try {
    const supabase = await createClient();

    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const proto = headersList.get("x-forwarded-proto") || "https";
    const siteUrl = `${proto}://${host}`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      validatedEmail,
      { redirectTo: `${siteUrl}/auth/callback?type=recovery` }
    );

    if (error) {
      logError(error, { action: "requestPasswordReset" });
    }

    // Always return success to prevent email enumeration
    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.AUTH_PASSWORD_RESET_REQUEST,
      action: "Password reset requested",
      outcome: "success",
      ipAddress: ipAddress ?? undefined,
      metadata: { email: validatedEmail.slice(0, 3) + "***" },
    });

    result = { success: true };
  } catch (error) {
    logError(error, { action: "requestPasswordReset" });
    result = { error: t("errors.serverError") };
  }

  // Apply constant-time delay to both success and error paths
  const elapsed = Date.now() - startTime;
  const delay = Math.max(0, MIN_RESPONSE_TIME + JITTER - elapsed);
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return result;
}

/**
 * リカバリーセッション後にパスワードを再設定する
 */
type PasswordResetResponse = { success: true } | { error: string };

export async function updatePasswordAfterReset(
  newPassword: string
): Promise<PasswordResetResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "updatePasswordAfterReset");
  if (originError) return { error: originError };

  const validation = validatePasswordResetInput(newPassword, t);
  if (!validation.success) {
    return { error: validation.error };
  }

  const ipAddress = await getRequestIp();

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    const { error } = await supabase.auth.updateUser({
      password: validation.data,
    });

    if (error) {
      logError(error, {
        action: "updatePasswordAfterReset",
        userId: user.id,
      });

      auditLog({
        timestamp: new Date().toISOString(),
        eventType: AuditEventType.AUTH_PASSWORD_RESET_COMPLETE,
        userId: user.id,
        action: "Password reset failed",
        outcome: "failure",
        errorMessage: error.message,
        ipAddress: ipAddress ?? undefined,
      });

      return { error: t("errors.serverError") };
    }

    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.AUTH_PASSWORD_RESET_COMPLETE,
      userId: user.id,
      action: "Password reset completed",
      outcome: "success",
      ipAddress: ipAddress ?? undefined,
    });

    return { success: true };
  } catch (error) {
    logError(error, { action: "updatePasswordAfterReset" });
    return { error: t("errors.serverError") };
  }
}
