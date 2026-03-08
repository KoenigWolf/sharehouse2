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

  // ZodIssue から制約値を抽出し、i18n テンプレート用のキー名にマッピング
  const issueConstraints: Record<string, number> = {};
  if ("minimum" in issue && typeof issue.minimum === "number") {
    issueConstraints.min = issue.minimum;
  }
  if ("maximum" in issue && typeof issue.maximum === "number") {
    issueConstraints.max = issue.maximum;
  }

  // 呼び出し元のパラメータと ZodIssue の制約値をマージ
  const keyParams = { ...issueConstraints, ...params?.[key] };

  if (Object.keys(keyParams).length > 0) {
    return t(key, keyParams);
  }

  return t(key);
}
