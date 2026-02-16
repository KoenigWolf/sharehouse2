/**
 * Design tokens matching the web app
 * Based on immedio style: clean, modern, warm
 */
export const Colors = {
  // Brand (Cyan/Teal)
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

  // Backgrounds
  background: "#FDFCF8", // Warm cream
  card: "#FFFFFF",
  muted: "#F5F3EE",

  // Text
  foreground: "#2F3E33", // Dark earth
  mutedForeground: "#6B7280",

  // Border
  border: "#E6E2D6", // Warm beige

  // Status
  success: "#059669",
  error: "#DC2626",
  warning: "#F59E0B",

  // Overlay
  overlay: "rgba(0, 0, 0, 0.5)",
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
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  full: 9999,
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
} as const;

// Animation easing matching web
export const Easing = {
  smooth: [0.25, 0.46, 0.45, 0.94],
  spring: { damping: 20, stiffness: 300 },
} as const;
