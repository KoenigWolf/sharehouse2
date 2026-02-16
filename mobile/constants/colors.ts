/**
 * Design Tokens - Share House Mobile
 * Web版と同期したカラーパレット（Slate + Cyan/Teal brand）
 */
export const Colors = {
  // Brand (Cyan/Teal) - immedio style
  brand: {
    50: "#ecfeff",
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4",
    600: "#0891b2",
    700: "#0e7490",
    800: "#155e75",
    900: "#164e63",
  },

  // Core palette - Slate based (Modern theme)
  background: "#f8fafc",
  foreground: "#0f172a",
  card: "#ffffff",
  cardForeground: "#0f172a",

  // Secondary / Muted
  secondary: "#f1f5f9",
  secondaryForeground: "#0f172a",
  muted: "#f1f5f9",
  mutedForeground: "#64748b",

  // Primary (same as brand-500)
  primary: "#06b6d4",
  primaryForeground: "#ffffff",

  // Accent
  accent: "#06b6d4",
  accentForeground: "#ffffff",

  // Border / Input
  border: "#e2e8f0",
  input: "#e2e8f0",
  ring: "#06b6d4",

  // Status colors
  success: "#059669",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",

  error: "#dc2626",
  errorBg: "#fef2f2",
  errorBorder: "#fecaca",

  warning: "#d97706",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",

  // Destructive
  destructive: "#dc2626",

  // Overlay
  overlay: "rgba(0, 0, 0, 0.4)",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  card: 24,
  section: 32,
  page: 16,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 9999,
  card: 16,
  button: 9999,
  input: 12,
  badge: 6,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
} as const;

export const FontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",
} as const;

// Animation easing matching web
export const Easing = {
  smooth: [0.25, 0.46, 0.45, 0.94],
  spring: { damping: 20, stiffness: 300 },
} as const;

// Shadow styles (for StyleSheet.create)
export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  cardHover: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 48,
    elevation: 12,
  },
} as const;
