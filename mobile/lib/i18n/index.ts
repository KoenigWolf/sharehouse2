import { useCallback } from "react";
import { getLocales } from "expo-localization";
import { en } from "./en";
import { ja } from "./ja";

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

type TranslationKey = NestedKeyOf<typeof en>;

const translations = { en, ja } as const;

function getDeviceLocale(): "en" | "ja" {
  const locales = getLocales();
  const primaryLocale = locales[0]?.languageCode ?? "en";
  return primaryLocale === "ja" ? "ja" : "en";
}

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }

  return typeof current === "string" ? current : path;
}

export function useI18n() {
  const locale = getDeviceLocale();
  const strings = translations[locale];

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      let value = getNestedValue(strings as unknown as Record<string, unknown>, key);

      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          value = value.replace(`{{${paramKey}}}`, String(paramValue));
        });
      }

      return value;
    },
    [strings]
  );

  return { t, locale };
}

export { en, ja };
