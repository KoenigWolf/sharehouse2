"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
  useTransition,
  type ReactNode,
} from "react";
import { updateThemePreferences } from "@/lib/theme/actions";
import { logError } from "@/lib/errors";

export type ThemeStyle = "modern" | "cottage" | "mono";
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

const VALID_THEMES: readonly ThemeStyle[] = ["modern", "cottage", "mono"];
const VALID_COLOR_MODES: readonly ColorMode[] = ["light", "dark", "system"];

function isValidThemeStyle(value: unknown): value is ThemeStyle {
  return typeof value === "string" && VALID_THEMES.includes(value as ThemeStyle);
}

function isValidColorMode(value: unknown): value is ColorMode {
  return typeof value === "string" && VALID_COLOR_MODES.includes(value as ColorMode);
}

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
    // Private browsing mode may block localStorage
  }
}

function getStoredTheme(): ThemeStyle {
  const stored = safeGetItem(THEME_STORAGE_KEY);
  if (isValidThemeStyle(stored)) return stored;
  return DEFAULT_THEME;
}

function getStoredColorMode(): ColorMode {
  const stored = safeGetItem(COLOR_MODE_STORAGE_KEY);
  if (isValidColorMode(stored)) return stored;
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

  // Server values take priority to preserve user settings across devices and prevent hydration flicker
  const [theme, setThemeState] = useState<ThemeStyle>(() => {
    if (initialTheme && isValidThemeStyle(initialTheme)) return initialTheme;
    if (typeof window === "undefined") return DEFAULT_THEME;
    return getStoredTheme();
  });

  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    if (initialColorMode && isValidColorMode(initialColorMode)) return initialColorMode;
    if (typeof window === "undefined") return DEFAULT_COLOR_MODE;
    return getStoredColorMode();
  });

  // Refs to access current state values in callbacks without re-creating them
  const themeRef = useRef(theme);
  const colorModeRef = useRef(colorMode);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    colorModeRef.current = colorMode;
  }, [colorMode]);

  const systemPreference = useSyncExternalStore(
    subscribeToSystemPreference,
    getSystemPreferenceSnapshot,
    getSystemPreferenceServerSnapshot
  );

  const resolvedColorMode = useMemo(() => {
    if (colorMode === "system") return systemPreference;
    return colorMode;
  }, [colorMode, systemPreference]);

  // Mutate document classes to ensure CSS renders correctly and matches server-side rendering
  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute("data-theme", theme);

    root.classList.remove("theme-modern", "theme-cottage", "theme-mono");
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

    // Defer server save to avoid blocking UI; uses startTransition for non-urgent update batching
    if (isLoggedIn) {
      startTransition(async () => {
        const result = await updateThemePreferences(newTheme, colorModeRef.current);
        if ("error" in result) {
          logError(new Error(result.error), { action: "setTheme", metadata: { theme: newTheme } });
        }
      });
    }
  }, [isLoggedIn]);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    safeSetItem(COLOR_MODE_STORAGE_KEY, mode);

    // Defer server save to avoid blocking UI; uses startTransition for non-urgent update batching
    if (isLoggedIn) {
      startTransition(async () => {
        const result = await updateThemePreferences(themeRef.current, mode);
        if ("error" in result) {
          logError(new Error(result.error), { action: "setColorMode", metadata: { colorMode: mode } });
        }
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
 * Inline script prevents flash of unstyled content (FOUC).
 * Runs before React hydration to apply correct theme classes immediately.
 */
export function ThemeScript({
  initialTheme,
  initialColorMode,
}: {
  initialTheme?: ThemeStyle | null;
  initialColorMode?: ColorMode | null;
} = {}) {
  // Validate and sanitize inputs to prevent XSS from potentially poisoned DB values
  const safeTheme = isValidThemeStyle(initialTheme) ? initialTheme : null;
  const safeColorMode = isValidColorMode(initialColorMode) ? initialColorMode : null;

  const themeDefault = safeTheme ?? DEFAULT_THEME;
  const colorModeDefault = safeColorMode ?? DEFAULT_COLOR_MODE;

  // Use JSON.stringify for safe embedding in script context
  const script = `
    (function() {
      try {
        var serverTheme = ${JSON.stringify(safeTheme)};
        var serverColorMode = ${JSON.stringify(safeColorMode)};
        var THEME_KEY = ${JSON.stringify(THEME_STORAGE_KEY)};
        var COLOR_KEY = ${JSON.stringify(COLOR_MODE_STORAGE_KEY)};
        var VALID_THEMES = ${JSON.stringify(VALID_THEMES)};
        var VALID_MODES = ${JSON.stringify(VALID_COLOR_MODES)};

        var storedTheme = localStorage.getItem(THEME_KEY);
        var storedMode = localStorage.getItem(COLOR_KEY);

        var theme = serverTheme || (VALID_THEMES.indexOf(storedTheme) >= 0 ? storedTheme : ${JSON.stringify(themeDefault)});
        var colorMode = serverColorMode || (VALID_MODES.indexOf(storedMode) >= 0 ? storedMode : ${JSON.stringify(colorModeDefault)});

        var resolved = colorMode;
        if (colorMode === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.classList.add('theme-' + theme);
        if (resolved === 'dark') {
          document.documentElement.classList.add('dark');
        }
        if (serverTheme) localStorage.setItem(THEME_KEY, serverTheme);
        if (serverColorMode) localStorage.setItem(COLOR_KEY, serverColorMode);
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
