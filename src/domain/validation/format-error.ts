import type { z } from "zod";
import type { TranslationKey, Translator } from "@/lib/i18n";

/**
 * Zod validation error を翻訳されたエラーメッセージに変換
 *
 * @param issue - Zod のバリデーションエラー
 * @param t - 翻訳関数
 * @param params - キーごとの翻訳パラメータ
 */
export function formatValidationError(
  issue: z.ZodIssue,
  t: Translator,
  params?: Partial<Record<TranslationKey, Record<string, number>>>
): string {
  const key = issue.message as TranslationKey;

  if (!key.includes(".")) {
    return t("errors.invalidInput");
  }

  const keyParams = params?.[key];
  if (keyParams) {
    return t(key, keyParams);
  }

  return t(key);
}
