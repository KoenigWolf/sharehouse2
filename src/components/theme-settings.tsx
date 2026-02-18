"use client";

import { memo } from "react";
import { m, motion, AnimatePresence } from "framer-motion";
import { Check, Sun, Moon, Monitor, Palette } from "lucide-react";
import { useTheme, type ThemeStyle, type ColorMode } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";

// Animation config with natural easing
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

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
    <m.button
      type="button"
      onClick={onSelect}
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex-1 min-h-[120px] p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
        isSelected
          ? "border-foreground bg-foreground/5 shadow-lg"
          : "border-border bg-card hover:border-foreground/30 hover:bg-muted/50"
      }`}
    >
      <AnimatePresence>
        {isSelected && (
          <motion.div
            layoutId="theme-check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-4 right-4 w-6 h-6 rounded-full bg-foreground flex items-center justify-center"
          >
            <Check size={14} strokeWidth={3} className="text-background" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-lg shadow-sm border border-foreground/10"
          style={{ backgroundColor: colors.primary }}
        />
        <div
          className="w-8 h-8 rounded-lg shadow-sm border border-foreground/10"
          style={{ backgroundColor: colors.secondary }}
        />
        <div
          className="w-8 h-8 rounded-lg shadow-sm border border-foreground/10"
          style={{ backgroundColor: colors.accent }}
        />
      </div>

      <h4 className="text-sm font-bold text-foreground mb-1.5">{label}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
    </m.button>
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
    <m.button
      type="button"
      onClick={onSelect}
      variants={itemVariants}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`flex flex-col items-center justify-center gap-2.5 min-w-[88px] h-[88px] p-4 rounded-2xl border-2 transition-all duration-200 ${
        isSelected
          ? "border-foreground bg-foreground/5 text-foreground shadow-md"
          : "border-border bg-card hover:border-foreground/30 hover:bg-muted/50 text-muted-foreground"
      }`}
    >
      <span className={isSelected ? "text-foreground" : "text-muted-foreground"}>
        {icon}
      </span>
      <span className="text-xs font-bold">{label}</span>
    </m.button>
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
        primary: "#09090b",
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
      icon: <Sun size={22} strokeWidth={1.5} />,
    },
    {
      value: "dark",
      labelKey: "theme.dark",
      icon: <Moon size={22} strokeWidth={1.5} />,
    },
    {
      value: "system",
      labelKey: "theme.system",
      icon: <Monitor size={22} strokeWidth={1.5} />,
    },
  ];

  return (
    <m.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <m.div variants={itemVariants} className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Palette size={18} className="text-brand-500" />
          </div>
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            {t("theme.sectionTitle")}
          </h2>
        </div>
        {isPending && (
          <span className="text-xs text-muted-foreground animate-pulse">
            {t("common.saving")}
          </span>
        )}
        <div className="flex-1 h-px bg-border" />
      </m.div>

      <div className="space-y-5">
        <m.h3 variants={itemVariants} className="text-sm font-semibold text-foreground ml-1">
          {t("theme.styleLabel")}
        </m.h3>
        <m.div variants={containerVariants} className="flex flex-col sm:flex-row gap-4">
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
        </m.div>
      </div>

      <div className="space-y-5">
        <m.h3 variants={itemVariants} className="text-sm font-semibold text-foreground ml-1">
          {t("theme.colorModeLabel")}
        </m.h3>
        <m.div variants={containerVariants} className="flex gap-3">
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
        </m.div>
      </div>
    </m.section>
  );
});
