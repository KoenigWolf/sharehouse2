"use client";

import { memo, useCallback, useState } from "react";
import { m, motion, AnimatePresence } from "framer-motion";
import { Languages, Check } from "lucide-react";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { staggerContainer, staggerItem } from "@/lib/animation";
import type { Locale } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";

interface LanguageOption {
  value: Locale;
  labelKey: TranslationKey;
  nativeLabel: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { value: "ja", labelKey: "settings.languageJapanese", nativeLabel: "日本語", flag: "🇯🇵" },
  { value: "en", labelKey: "settings.languageEnglish", nativeLabel: "English", flag: "🇺🇸" },
];

export const LanguageSettings = memo(function LanguageSettings() {
  const t = useI18n();
  const currentLocale = useLocale();
  const [selectedLocale, setSelectedLocale] = useState<Locale>(currentLocale);
  const [isChanging, setIsChanging] = useState(false);

  const handleLocaleChange = useCallback((locale: Locale) => {
    setSelectedLocale(locale);
    setIsChanging(true);
    document.documentElement.lang = locale;
    document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    window.location.reload();
  }, []);

  return (
    <m.section
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Section header */}
      <m.div variants={staggerItem} className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Languages size={18} className="text-brand-500" />
          </div>
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            {t("settings.language")}
          </h2>
        </div>
        {isChanging && (
          <span className="text-xs text-muted-foreground animate-pulse">
            {t("common.saving")}
          </span>
        )}
        <div className="flex-1 h-px bg-border" />
      </m.div>

      {/* Language options - min 88px height for touch targets */}
      <m.div variants={staggerContainer} className="flex gap-4">
        {LANGUAGES.map((lang) => (
          <m.button
            key={lang.value}
            type="button"
            onClick={() => handleLocaleChange(lang.value)}
            disabled={isChanging}
            variants={staggerItem}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`relative flex-1 min-h-[100px] p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
              selectedLocale === lang.value
                ? "border-foreground bg-foreground/5 shadow-lg"
                : "border-border bg-card hover:border-foreground/30 hover:bg-muted/50"
            }`}
          >
            {/* Selected indicator */}
            <AnimatePresence>
              {selectedLocale === lang.value && (
                <motion.div
                  layoutId="language-check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-4 right-4 w-6 h-6 rounded-full bg-foreground flex items-center justify-center"
                >
                  <Check size={14} strokeWidth={3} className="text-background" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Flag emoji */}
            <span className="text-2xl mb-3 block">{lang.flag}</span>

            {/* Labels */}
            <h4 className="text-sm font-bold text-foreground mb-1">{lang.nativeLabel}</h4>
            <p className="text-xs text-muted-foreground">{t(lang.labelKey)}</p>
          </m.button>
        ))}
      </m.div>
    </m.section>
  );
});
