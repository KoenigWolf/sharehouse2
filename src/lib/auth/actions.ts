"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateSignUp, validateSignIn } from "@/domain/validation/auth";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import {
  RateLimiters,
  formatRateLimitError,
  AuditActions,
  AuditEventType,
  auditLog,
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
 * Sign up a new user with email and password
 * Includes rate limiting and audit logging
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

  // Server-side validation
  const validation = validateSignUp({ name, email, password }, t);
  if (!validation.success) {
    return { error: validation.error || t("errors.invalidInput") };
  }

  const {
    name: validatedName,
    email: validatedEmail,
    password: validatedPassword,
  } = validation.data!;

  // Rate limiting
  const ipAddress = await getRequestIp();
  const rateLimitKey = ipAddress
    ? `${validatedEmail}:${ipAddress}`
    : validatedEmail;
  const rateLimitResult = RateLimiters.auth(rateLimitKey);
  if (!rateLimitResult.success) {
    AuditActions.rateLimited(validatedEmail, "signUp", ipAddress || undefined);
    return { error: formatRateLimitError(rateLimitResult.retryAfter, t) };
  }

  try {
    const supabase = await createClient();

    // Create user
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

      // Audit failed signup
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

    // Check if email confirmation is needed (identities is empty)
    if (data.user.identities?.length === 0) {
      return { error: t("auth.emailAlreadyExists") };
    }

    // If no session, email confirmation is required
    if (!data.session) {
      auditLog({
        timestamp: new Date().toISOString(),
        eventType: AuditEventType.AUTH_SIGNUP,
        userId: data.user.id,
        action: "User signup - confirmation email sent",
        outcome: "success",
        ipAddress: ipAddress || undefined,
      });

      return {
        success: true,
        needsEmailConfirmation: true,
        message: t("auth.confirmationEmailSent"),
      };
    }

    // Create profile
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

    // Audit successful signup
    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.AUTH_SIGNUP,
      userId: data.user.id,
      action: "User signup completed",
      outcome: "success",
      ipAddress: ipAddress || undefined,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    logError(error, { action: "signUp" });
    return { error: t("errors.serverError") };
  }
}

/**
 * Sign in a user with email and password
 * Includes rate limiting and audit logging
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

  // Server-side validation
  const validation = validateSignIn({ email, password }, t);
  if (!validation.success) {
    return { error: validation.error || t("errors.invalidInput") };
  }

  const { email: validatedEmail, password: validatedPassword } =
    validation.data!;

  // Rate limiting - use email as identifier
  const ipAddress = await getRequestIp();
  const rateLimitKey = ipAddress
    ? `${validatedEmail}:${ipAddress}`
    : validatedEmail;
  const rateLimitResult = RateLimiters.auth(rateLimitKey);
  if (!rateLimitResult.success) {
    AuditActions.rateLimited(validatedEmail, "signIn", ipAddress || undefined);
    return { error: formatRateLimitError(rateLimitResult.retryAfter, t) };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedEmail,
      password: validatedPassword,
    });

    if (error) {
      logError(error, { action: "signIn", metadata: { email: validatedEmail } });

      // Audit failed login
      AuditActions.loginFailure(validatedEmail, error.message, ipAddress || undefined);

      return { error: t("auth.invalidCredentials") };
    }

    // Ensure profile exists, create if not
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

    // Audit successful login
    AuditActions.loginSuccess(data.user.id);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    logError(error, { action: "signIn" });
    return { error: t("errors.serverError") };
  }
}
