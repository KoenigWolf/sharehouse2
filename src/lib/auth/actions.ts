"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateSignUp, validateSignIn } from "@/lib/validations/auth";
import { logError } from "@/lib/errors";
import { t } from "@/lib/i18n";
import {
  RateLimiters,
  formatRateLimitError,
  AuditActions,
  AuditEventType,
  auditLog,
} from "@/lib/security";

/**
 * Response types for auth actions
 */
type SignUpResponse =
  | { success: true }
  | { success: true; needsEmailConfirmation: true; message: string }
  | { error: string };

type SignInResponse = { success: true } | { error: string };

/**
 * Create default profile data for a new user
 */
function createDefaultProfile(userId: string, name: string) {
  return {
    id: userId,
    name: name.trim(),
    room_number: null,
    bio: null,
    avatar_url: null,
    interests: [],
    move_in_date: null,
  };
}

/**
 * Sign up a new user with email and password
 * Includes rate limiting and audit logging
 */
export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<SignUpResponse> {
  // Server-side validation
  const validation = validateSignUp({ name, email, password });
  if (!validation.success) {
    return { error: validation.error || t("errors.invalidInput") };
  }

  const {
    name: validatedName,
    email: validatedEmail,
    password: validatedPassword,
  } = validation.data!;

  // Rate limiting
  const rateLimitResult = RateLimiters.auth(validatedEmail);
  if (!rateLimitResult.success) {
    AuditActions.rateLimited(validatedEmail, "signUp");
    return { error: formatRateLimitError(rateLimitResult.retryAfter) };
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
        metadata: { email: validatedEmail.slice(0, 3) + "***" },
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
      .insert(createDefaultProfile(data.user.id, validatedName));

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
  // Server-side validation
  const validation = validateSignIn({ email, password });
  if (!validation.success) {
    return { error: validation.error || t("errors.invalidInput") };
  }

  const { email: validatedEmail, password: validatedPassword } =
    validation.data!;

  // Rate limiting - use email as identifier
  const rateLimitResult = RateLimiters.auth(validatedEmail);
  if (!rateLimitResult.success) {
    AuditActions.rateLimited(validatedEmail, "signIn");
    return { error: formatRateLimitError(rateLimitResult.retryAfter) };
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
      AuditActions.loginFailure(validatedEmail, error.message);

      return { error: t("auth.invalidCredentials") };
    }

    // Ensure profile exists, create if not
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      const userName =
        data.user.user_metadata?.name ||
        data.user.email?.split("@")[0] ||
        "ユーザー";

      const { error: profileError } = await supabase
        .from("profiles")
        .insert(createDefaultProfile(data.user.id, userName));

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
