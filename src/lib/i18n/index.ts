/**
 * i18n utilities
 * Simple translation system for Japanese-first application
 */

import { ja, type Translations } from "./ja";

// Current locale (can be extended for multi-language support)
const currentLocale = "ja";

// Translations map
const translations: Record<string, Translations> = {
  ja,
};

/**
 * Get current translations object
 */
export function getTranslations(): Translations {
  return translations[currentLocale] || ja;
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

/**
 * Get translation by key path
 * @param key - Dot-notation key path (e.g., "auth.login")
 * @param params - Optional parameters for interpolation
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const translations = getTranslations();
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

// Re-export translations
export { ja };
export type { Translations };
