"use client";

import { memo, useCallback, useState } from "react";
import { m, motion } from "framer-motion";
import { Languages, Check } from "lucide-react";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { ICON_SIZE, ICON_STROKE, ICON_GAP } from "@/lib/constants/icons";
import type { Locale } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";

interface LanguageOption {
  value: Locale;
  labelKey: TranslationKey;
  nativeLabel: string;
}

const LANGUAGES: LanguageOption[] = [
  { value: "ja", labelKey: "settings.languageJapanese", nativeLabel: "日本語" },
  { value: "en", labelKey: "settings.languageEnglish", nativeLabel: "English" },
];

export const LanguageSettings = memo(function LanguageSettings() {
  const t = useI18n();
  const currentLocale = useLocale();
  const [selectedLocale, setSelectedLocale] = useState<Locale>(currentLocale);
  const [isChanging, setIsChanging] = useState(false);

  const handleLocaleChange = useCallback((locale: Locale) => {
    setSelectedLocale(locale);
    setIsChanging(true);
    // Update document lang attribute
    document.documentElement.lang = locale;
    // Store in cookie for server-side locale detection
    document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    // Reload to apply new locale
    window.location.reload();
  }, []);

  return (
    <m.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <div className={`flex items-center ${ICON_GAP.md}`}>
          <Languages size={ICON_SIZE.md} strokeWidth={ICON_STROKE.normal} className="text-brand-500" />
          <h2 className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase whitespace-nowrap">
            {t("settings.language")}
          </h2>
        </div>
        {isChanging && (
          <span className="text-[10px] text-muted-foreground animate-pulse">
            {t("common.saving")}
          </span>
        )}
        <div className="flex-1 h-px bg-secondary" />
      </div>

      <div className="flex gap-4">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.value}
            type="button"
            onClick={() => handleLocaleChange(lang.value)}
            disabled={isChanging}
            className={`relative flex-1 p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
              selectedLocale === lang.value
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            {selectedLocale === lang.value && (
              <motion.div
                layoutId="language-check"
                className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
              >
                <Check size={ICON_SIZE.xs} strokeWidth={ICON_STROKE.bold} className="text-white" />
              </motion.div>
            )}

            <h4 className="text-sm font-bold text-foreground mb-1">{lang.nativeLabel}</h4>
            <p className="text-[11px] text-muted-foreground">{t(lang.labelKey)}</p>
          </button>
        ))}
      </div>
    </m.section>
  );
});
