/**
 * Theme constants for consistent styling across the application
 * Based on Muji-inspired minimalist design
 */

export const colors = {
  // Brand colors (DESIGN.md: black-based, no red)
  primary: "#1a1a1a",
  primaryHover: "#333333",

  // Text colors
  text: {
    primary: "#1a1a1a",
    secondary: "#737373",
    tertiary: "#a3a3a3",
    inverse: "#ffffff",
    placeholder: "#d4d4d4",
  },

  // Background colors
  background: {
    primary: "#fafaf8",
    secondary: "#f5f5f3",
    card: "#ffffff",
  },

  // Border colors
  border: {
    primary: "#e5e5e5",
    secondary: "#d4d4d4",
  },

  // Status colors (DESIGN.md: muted, low-saturation)
  status: {
    success: "#6b8b6b",
    successBg: "#f8faf8",
    successBorder: "#a0c9a0",
    error: "#8b6b6b",
    errorBg: "#faf8f8",
    errorBorder: "#c9a0a0",
  },
} as const;

export const spacing = {
  container: {
    mobile: "px-3",
    desktop: "sm:px-4",
    responsive: "px-3 sm:px-4",
  },
  section: {
    mobile: "py-3",
    desktop: "sm:py-4",
    responsive: "py-3 sm:py-4",
  },
} as const;

export const typography = {
  sizes: {
    xs: "text-[10px] sm:text-[11px]",
    sm: "text-[11px] sm:text-xs",
    base: "text-xs sm:text-sm",
    lg: "text-sm sm:text-base",
    xl: "text-base sm:text-lg",
  },
} as const;

export const components = {
  button: {
    base: "rounded-none transition-colors",
    primary: `bg-[${colors.primary}] hover:bg-[${colors.primaryHover}] text-white`,
    outline: `border border-[${colors.border.primary}] text-[${colors.text.secondary}] hover:border-[${colors.text.primary}]`,
  },
  input: {
    base: `border-[${colors.border.primary}] rounded-none focus:border-[${colors.text.primary}] focus:ring-0`,
  },
  card: {
    base: `bg-white border border-[${colors.border.primary}]`,
    mock: `bg-white border border-dashed border-[${colors.border.secondary}]`,
  },
} as const;

// Type exports for type safety
export type ThemeColors = typeof colors;
export type ThemeSpacing = typeof spacing;
export type ThemeTypography = typeof typography;
