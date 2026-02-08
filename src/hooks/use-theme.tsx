"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useSyncExternalStore,
  useTransition,
  type ReactNode,
} from "react";
import { updateThemePreferences } from "@/lib/theme/actions";

export type ThemeStyle = "modern" | "cottage";
export type ColorMode = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: ThemeStyle;
  colorMode: ColorMode;
  resolvedColorMode: "light" | "dark";
  setTheme: (theme: ThemeStyle) => void;
  setColorMode: (mode: ColorMode) => void;
  isPending: boolean;
}

const THEME_STORAGE_KEY = "sharehouse-theme";
const COLOR_MODE_STORAGE_KEY = "sharehouse-color-mode";
const DEFAULT_THEME: ThemeStyle = "cottage";
const DEFAULT_COLOR_MODE: ColorMode = "light";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribeToSystemPreference(callback: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getSystemPreferenceSnapshot(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getSystemPreferenceServerSnapshot(): "light" | "dark" {
  return "light";
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors (e.g., private browsing)
  }
}

function getStoredTheme(): ThemeStyle {
  const stored = safeGetItem(THEME_STORAGE_KEY);
  if (stored === "modern" || stored === "cottage") return stored;
  return DEFAULT_THEME;
}

function getStoredColorMode(): ColorMode {
  const stored = safeGetItem(COLOR_MODE_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return DEFAULT_COLOR_MODE;
}

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeStyle | null;
  initialColorMode?: ColorMode | null;
  isLoggedIn?: boolean;
}

export function ThemeProvider({
  children,
  initialTheme,
  initialColorMode,
  isLoggedIn = false,
}: ThemeProviderProps) {
  const [isPending, startTransition] = useTransition();

  // Use server initial values if available, otherwise fall back to localStorage
  const [theme, setThemeState] = useState<ThemeStyle>(() => {
    if (initialTheme) return initialTheme;
    if (typeof window === "undefined") return DEFAULT_THEME;
    return getStoredTheme();
  });

  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    if (initialColorMode) return initialColorMode;
    if (typeof window === "undefined") return DEFAULT_COLOR_MODE;
    return getStoredColorMode();
  });

  const systemPreference = useSyncExternalStore(
    subscribeToSystemPreference,
    getSystemPreferenceSnapshot,
    getSystemPreferenceServerSnapshot
  );

  const resolvedColorMode = useMemo(() => {
    if (colorMode === "system") return systemPreference;
    return colorMode;
  }, [colorMode, systemPreference]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute("data-theme", theme);

    root.classList.remove("theme-modern", "theme-cottage");
    root.classList.add(`theme-${theme}`);

    if (resolvedColorMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, resolvedColorMode]);

  const setTheme = useCallback((newTheme: ThemeStyle) => {
    setThemeState(newTheme);
    safeSetItem(THEME_STORAGE_KEY, newTheme);

    // Save to server if logged in
    if (isLoggedIn) {
      startTransition(() => {
        const currentColorMode = safeGetItem(COLOR_MODE_STORAGE_KEY) as ColorMode ?? DEFAULT_COLOR_MODE;
        updateThemePreferences(newTheme, currentColorMode);
      });
    }
  }, [isLoggedIn]);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    safeSetItem(COLOR_MODE_STORAGE_KEY, mode);

    // Save to server if logged in
    if (isLoggedIn) {
      startTransition(() => {
        const currentTheme = safeGetItem(THEME_STORAGE_KEY) as ThemeStyle ?? DEFAULT_THEME;
        updateThemePreferences(currentTheme, mode);
      });
    }
  }, [isLoggedIn]);

  const contextValue = useMemo(() => ({
    theme,
    colorMode,
    resolvedColorMode,
    setTheme,
    setColorMode,
    isPending,
  }), [theme, colorMode, resolvedColorMode, setTheme, setColorMode, isPending]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Script to prevent flash of unstyled content.
 * Inject this in the <head> before any content.
 */
export function ThemeScript({
  initialTheme,
  initialColorMode,
}: {
  initialTheme?: ThemeStyle | null;
  initialColorMode?: ColorMode | null;
} = {}) {
  const themeDefault = initialTheme ?? DEFAULT_THEME;
  const colorModeDefault = initialColorMode ?? DEFAULT_COLOR_MODE;

  const script = `
    (function() {
      try {
        var serverTheme = ${initialTheme ? `'${initialTheme}'` : 'null'};
        var serverColorMode = ${initialColorMode ? `'${initialColorMode}'` : 'null'};
        var theme = serverTheme || localStorage.getItem('${THEME_STORAGE_KEY}') || '${themeDefault}';
        var colorMode = serverColorMode || localStorage.getItem('${COLOR_MODE_STORAGE_KEY}') || '${colorModeDefault}';
        var resolved = colorMode;
        if (colorMode === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.classList.add('theme-' + theme);
        if (resolved === 'dark') {
          document.documentElement.classList.add('dark');
        }
        // Sync server values to localStorage for consistency
        if (serverTheme) localStorage.setItem('${THEME_STORAGE_KEY}', serverTheme);
        if (serverColorMode) localStorage.setItem('${COLOR_MODE_STORAGE_KEY}', serverColorMode);
      } catch (e) {}
    })();
  `.trim();

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
