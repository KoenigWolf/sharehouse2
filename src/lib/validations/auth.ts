import { z } from "zod";
import { PROFILE, AUTH } from "@/lib/constants/config";
import { sanitizeEmail } from "@/lib/security/validation";

/**
 * Authentication validation schemas
 * Implements OWASP password recommendations
 */

// Email validation with sanitization
export const emailSchema = z
  .string()
  .min(1, "メールアドレスを入力してください")
  .email("有効なメールアドレスを入力してください")
  .max(255, "メールアドレスが長すぎます")
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
  .min(AUTH.passwordMinLength, `パスワードは${AUTH.passwordMinLength}文字以上で入力してください`)
  .max(AUTH.passwordMaxLength, "パスワードが長すぎます")
  .refine(
    (password) => /[A-Z]/.test(password),
    "パスワードに大文字を1文字以上含めてください"
  )
  .refine(
    (password) => /[a-z]/.test(password),
    "パスワードに小文字を1文字以上含めてください"
  )
  .refine(
    (password) => /[0-9]/.test(password),
    "パスワードに数字を1文字以上含めてください"
  )
  .refine(
    (password) => !/\s/.test(password),
    "パスワードに空白を含めることはできません"
  );

/**
 * Password schema for login (less strict, just check non-empty)
 * Existing users may have older password formats
 */
export const passwordLoginSchema = z
  .string()
  .min(1, "パスワードを入力してください");

// Name validation
export const nameSchema = z
  .string()
  .min(1, "名前を入力してください")
  .max(PROFILE.nameMaxLength, `名前は${PROFILE.nameMaxLength}文字以内で入力してください`)
  .transform((val) => val.trim());

// Sign up schema
export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

// Sign in schema (uses less strict password validation for existing users)
export const signInSchema = z.object({
  email: emailSchema,
  password: passwordLoginSchema,
});

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Validate sign up input
 */
export function validateSignUp(data: unknown): {
  success: boolean;
  data?: SignUpInput;
  error?: string;
} {
  const result = signUpSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message || "入力が無効です" };
}

/**
 * Validate sign in input
 */
export function validateSignIn(data: unknown): {
  success: boolean;
  data?: SignInInput;
  error?: string;
} {
  const result = signInSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message || "入力が無効です" };
}
