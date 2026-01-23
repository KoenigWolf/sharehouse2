"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateSignUp, validateSignIn } from "@/lib/validations/auth";
import { logError, ErrorCode } from "@/lib/errors";
import { t } from "@/lib/i18n";

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

  const { name: validatedName, email: validatedEmail, password: validatedPassword } = validation.data!;

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

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    logError(error, { action: "signUp" });
    return { error: t("errors.serverError") };
  }
}

/**
 * Sign in a user with email and password
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

  const { email: validatedEmail, password: validatedPassword } = validation.data!;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedEmail,
      password: validatedPassword,
    });

    if (error) {
      logError(error, { action: "signIn", metadata: { email: validatedEmail } });
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

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    logError(error, { action: "signIn" });
    return { error: t("errors.serverError") };
  }
}
