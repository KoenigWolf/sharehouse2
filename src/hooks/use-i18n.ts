import { useMemo } from "react";
import {
  createTranslator,
  DEFAULT_LOCALE,
  normalizeLocale,
  type Locale,
  type Translator,
} from "@/lib/i18n";

function detectClientLocale(): Locale {
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang || navigator.language;
    return normalizeLocale(lang);
  }
  return DEFAULT_LOCALE;
}

export function useI18n(preferredLocale?: Locale): Translator {
  const locale = preferredLocale ?? detectClientLocale();
  return useMemo(() => createTranslator(locale), [locale]);
}
