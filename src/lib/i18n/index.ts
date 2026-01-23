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
        str.replace(new RegExp(`{{${paramKey}}}`, "g"), String(paramValue)),
      value
    );
  }

  return value;
}

export function createTranslator(locale: Locale = DEFAULT_LOCALE): Translator {
  return (key, params) => translate(locale, key, params);
}

export function t(
  key: TranslationKey,
  params?: Record<string, string | number>,
  locale: Locale = DEFAULT_LOCALE
): string {
  return translate(locale, key, params);
}

export { en, ja };
export type { Translations };
