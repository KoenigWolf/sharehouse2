"use client";

import { memo } from "react";
import { m, motion } from "framer-motion";
import { Check, Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type ThemeStyle, type ColorMode } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";
import { ICON_SIZE, ICON_STROKE } from "@/lib/constants/icons";

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
        <motion.div
          layoutId="theme-check"
          className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
        >
          <Check size={ICON_SIZE.xs} strokeWidth={ICON_STROKE.bold} className="text-white" />
        </motion.div>
      )}

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
    {
      value: "mono",
      labelKey: "theme.mono",
      descriptionKey: "theme.monoDescription",
      colors: {
        primary: "#18181b",
        secondary: "#ffffff",
        accent: "#71717a",
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
      icon: <Sun size={ICON_SIZE.lg} strokeWidth={ICON_STROKE.normal} />,
    },
    {
      value: "dark",
      labelKey: "theme.dark",
      icon: <Moon size={ICON_SIZE.lg} strokeWidth={ICON_STROKE.normal} />,
    },
    {
      value: "system",
      labelKey: "theme.system",
      icon: <Monitor size={ICON_SIZE.lg} strokeWidth={ICON_STROKE.normal} />,
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
