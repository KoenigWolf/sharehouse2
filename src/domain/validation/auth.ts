import { z } from "zod";
import { PROFILE, AUTH } from "@/lib/constants/config";
import { sanitizeEmail } from "@/lib/security/validation";
import type { TranslationKey, Translator } from "@/lib/i18n";

/**
 * Authentication validation schemas
 * Implements OWASP password recommendations
 */

export const emailSchema = z
  .string()
  .min(1, "auth.emailRequired")
  .email("validation.emailInvalid")
  .max(255, "validation.emailTooLong")
  .transform(sanitizeEmail);

/**
 * Strong password validation
 * - Minimum 10 characters (OWASP recommendation)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - Maximum 128 characters
 */
export const passwordSchema = z
  .string()
  .min(AUTH.passwordMinLength, "auth.passwordMinLength")
  .max(AUTH.passwordMaxLength, "validation.passwordTooLong")
  .refine(
    (password) => /[A-Z]/.test(password),
    "validation.passwordUppercase"
  )
  .refine(
    (password) => /[a-z]/.test(password),
    "validation.passwordLowercase"
  )
  .refine(
    (password) => /[0-9]/.test(password),
    "validation.passwordNumber"
  )
  .refine(
    (password) => !/\s/.test(password),
    "validation.passwordNoWhitespace"
  );

/**
 * Password schema for login (less strict, just check non-empty)
 * Existing users may have older password formats
 */
export const passwordLoginSchema = z
  .string()
  .min(1, "auth.passwordRequired");

export const nameSchema = z
  .string()
  .min(1, "auth.nameRequired")
  .max(PROFILE.nameMaxLength, "validation.nameMaxLength")
  .transform((val) => val.trim());

export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordLoginSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

const VALIDATION_PARAMS: Partial<Record<TranslationKey, Record<string, number>>> = {
  "auth.passwordMinLength": { min: AUTH.passwordMinLength },
  "validation.nameMaxLength": { max: PROFILE.nameMaxLength },
};

function formatValidationError(
  issue: z.ZodIssue,
  t: Translator
): string {
  const key = issue.message as TranslationKey;
  if (!key.includes(".")) {
    return t("errors.invalidInput");
  }
  const params = VALIDATION_PARAMS[key];

  if (params) {
    return t(key, params);
  }

  return t(key);
}

/**
 * Validate sign up input
 */
export function validateSignUp(
  data: unknown,
  t: Translator
): {
  success: boolean;
  data?: SignUpInput;
  error?: string;
} {
  const result = signUpSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const issue = result.error.issues[0];
  return {
    success: false,
    error: issue ? formatValidationError(issue, t) : t("errors.invalidInput"),
  };
}

/**
 * Validate password for reset flow
 */
export function validatePasswordResetInput(
  password: unknown,
  t: Translator
): {
  success: boolean;
  data?: string;
  error?: string;
} {
  const result = passwordSchema.safeParse(password);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const issue = result.error.issues[0];
  return {
    success: false,
    error: issue ? formatValidationError(issue, t) : t("errors.invalidInput"),
  };
}

/**
 * Validate sign in input
 */
export function validateSignIn(
  data: unknown,
  t: Translator
): {
  success: boolean;
  data?: SignInInput;
  error?: string;
} {
  const result = signInSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const issue = result.error.issues[0];
  return {
    success: false,
    error: issue ? formatValidationError(issue, t) : t("errors.invalidInput"),
  };
}
