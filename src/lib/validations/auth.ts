import { z } from "zod";
import { PROFILE, AUTH } from "@/lib/constants/config";

/**
 * Authentication validation schemas
 */

// Email validation
export const emailSchema = z
  .string()
  .min(1, "メールアドレスを入力してください")
  .email("有効なメールアドレスを入力してください")
  .max(255, "メールアドレスが長すぎます");

// Password validation
export const passwordSchema = z
  .string()
  .min(AUTH.passwordMinLength, `パスワードは${AUTH.passwordMinLength}文字以上で入力してください`)
  .max(128, "パスワードが長すぎます");

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

// Sign in schema
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "パスワードを入力してください"),
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
