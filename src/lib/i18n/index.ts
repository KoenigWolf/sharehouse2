/**
 * i18n utilities
 * Simple translation system for Japanese-first application
 */

import { ja, type Translations } from "./ja";
import { en } from "./en";

export const SUPPORTED_LOCALES = ["ja", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ja";

const translations: Record<Locale, Translations> = {
  ja,
  en,
};

/**
 * ロケール文字列を正規化する
 *
 * "ja-JP" → "ja"、"en-US" → "en" のようにサポート対象ロケールに変換する。
 * 未対応または空の場合はデフォルトロケール(ja)を返す。
 *
 * @param input - ブラウザのlang属性やnavigator.language等のロケール文字列
 * @returns 正規化されたロケール
 */
export function normalizeLocale(input?: string | null): Locale {
  const normalized = input?.toLowerCase();
  if (!normalized) return DEFAULT_LOCALE;
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

/**
 * Get current translations object
 */
export function getTranslations(locale: Locale = DEFAULT_LOCALE): Translations {
  return translations[locale] || ja;
}

/**
 * Type-safe translation getter using dot notation
 * @example t("auth.login") => "ログイン"
 */
type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>];
    }[Extract<keyof T, string>];

type Join<T extends string[], D extends string> = T extends []
  ? never
  : T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends string
    ? `${F}${D}${Join<Extract<R, string[]>, D>}`
    : never
  : string;

export type TranslationKey = Join<PathsToStringProps<Translations>, ".">;

export type Translator = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

/**
 * Get translation by key path
 * @param key - Dot-notation key path (e.g., "auth.login")
 * @param params - Optional parameters for interpolation
 */
function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const translations = getTranslations(locale);
  const keys = key.split(".");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  if (typeof value !== "string") {
    console.warn(`Translation value is not a string: ${key}`);
    return key;
  }

  // Simple parameter interpolation
  if (params) {
    return Object.entries(params).reduce(
      (str, [paramKey, paramValue]) =>
        str.replaceAll(`{{${paramKey}}}`, String(paramValue)),
      value
    );
  }

  return value;
}

/**
 * 指定ロケールの翻訳関数を生成する
 *
 * @param locale - 使用するロケール（デフォルト: ja）
 * @returns ドットパス記法キーとパラメータを受け取る翻訳関数
 */
export function createTranslator(locale: Locale = DEFAULT_LOCALE): Translator {
  return (key, params) => translate(locale, key, params);
}

/**
 * グローバル翻訳ヘルパー（サーバーサイド等でフック外から使用）
 *
 * @param key - ドットパス記法の翻訳キー
 * @param params - 補間パラメータ（例: `{ count: 5 }`）
 * @param locale - 使用ロケール（デフォルト: ja）
 * @returns 翻訳済み文字列
 */
export function t(
  key: TranslationKey,
  params?: Record<string, string | number>,
  locale: Locale = DEFAULT_LOCALE
): string {
  return translate(locale, key, params);
}

export { en, ja };
export type { Translations };
