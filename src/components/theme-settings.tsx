"use client";

import { memo } from "react";
import { m } from "framer-motion";
import { useTheme, type ThemeStyle, type ColorMode } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";

interface ThemeOptionProps {
  value: ThemeStyle;
  label: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const ThemeOption = memo(function ThemeOption({
  label,
  description,
  isSelected,
  onSelect,
  colors,
}: ThemeOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex-1 p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
        isSelected
          ? "border-primary bg-primary/10 shadow-md"
          : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
      }`}
    >
      {isSelected && (
        <m.div
          layoutId="theme-check"
          className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
        >
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </m.div>
      )}

      {/* Color preview */}
      <div className="flex gap-1.5 mb-3">
        <div
          className="w-6 h-6 rounded-lg shadow-sm border border-foreground/20"
          style={{ backgroundColor: colors.primary }}
        />
        <div
          className="w-6 h-6 rounded-lg shadow-sm border border-foreground/20"
          style={{ backgroundColor: colors.secondary }}
        />
        <div
          className="w-6 h-6 rounded-lg shadow-sm border border-foreground/20"
          style={{ backgroundColor: colors.accent }}
        />
      </div>

      <h4 className="text-sm font-bold text-foreground mb-1">{label}</h4>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {description}
      </p>
    </button>
  );
});

interface ColorModeOptionProps {
  value: ColorMode;
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
}

const ColorModeOption = memo(function ColorModeOption({
  label,
  icon,
  isSelected,
  onSelect,
}: ColorModeOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
        isSelected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-card hover:border-primary/50 hover:bg-muted/50 text-muted-foreground"
      }`}
    >
      <span className={isSelected ? "text-primary" : "text-muted-foreground"}>
        {icon}
      </span>
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
});

export const ThemeSettings = memo(function ThemeSettings() {
  const { theme, colorMode, setTheme, setColorMode, isPending } = useTheme();
  const t = useI18n();

  const themes: {
    value: ThemeStyle;
    labelKey: string;
    descriptionKey: string;
    colors: { primary: string; secondary: string; accent: string };
  }[] = [
    {
      value: "cottage",
      labelKey: "theme.cottage",
      descriptionKey: "theme.cottageDescription",
      colors: {
        primary: "#4a6741",
        secondary: "#fdfcf8",
        accent: "#e0b06b",
      },
    },
    {
      value: "modern",
      labelKey: "theme.modern",
      descriptionKey: "theme.modernDescription",
      colors: {
        primary: "#10b981",
        secondary: "#f8fafc",
        accent: "#8b5cf6",
      },
    },
  ];

  const colorModes: {
    value: ColorMode;
    labelKey: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "light",
      labelKey: "theme.light",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ),
    },
    {
      value: "dark",
      labelKey: "theme.dark",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
    },
    {
      value: "system",
      labelKey: "theme.system",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      ),
    },
  ];

  return (
    <m.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4">
        <h2 className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase whitespace-nowrap">
          {t("theme.sectionTitle")}
        </h2>
        {isPending && (
          <span className="text-[10px] text-muted-foreground animate-pulse">
            {t("common.saving")}
          </span>
        )}
        <div className="flex-1 h-px bg-secondary" />
      </div>

      {/* Theme Style */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
          {t("theme.styleLabel")}
        </h3>
        <div className="flex gap-4">
          {themes.map((themeOption) => (
            <ThemeOption
              key={themeOption.value}
              value={themeOption.value}
              label={t(themeOption.labelKey as Parameters<typeof t>[0])}
              description={t(themeOption.descriptionKey as Parameters<typeof t>[0])}
              isSelected={theme === themeOption.value}
              onSelect={() => setTheme(themeOption.value)}
              colors={themeOption.colors}
            />
          ))}
        </div>
      </div>

      {/* Color Mode */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
          {t("theme.colorModeLabel")}
        </h3>
        <div className="flex gap-3">
          {colorModes.map((mode) => (
            <ColorModeOption
              key={mode.value}
              value={mode.value}
              label={t(mode.labelKey as Parameters<typeof t>[0])}
              icon={mode.icon}
              isSelected={colorMode === mode.value}
              onSelect={() => setColorMode(mode.value)}
            />
          ))}
        </div>
      </div>
    </m.section>
  );
});
