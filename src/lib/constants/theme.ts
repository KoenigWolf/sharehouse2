/**
 * Theme constants for consistent styling across the application
 * Based on Muji-inspired minimalist design
 */

export const colors = {
  // Brand colors (DESIGN_GUIDELINES.md: black-based, no red)
  primary: "#18181b",
  primaryHover: "#27272a",

  text: {
    primary: "#18181b",
    secondary: "#71717a",
    tertiary: "#a1a1aa",
    inverse: "#ffffff",
    placeholder: "#d4d4d8",
  },

  background: {
    primary: "#fafafa",
    secondary: "#f4f4f5",
    card: "#ffffff",
  },

  border: {
    primary: "#e4e4e7",
    secondary: "#d4d4d8",
  },

  // Status colors (DESIGN_GUIDELINES.md: muted, low-saturation)
  status: {
    success: "#3d6b4a",
    successBg: "#f0fdf4",
    successBorder: "#93c5a0",
    error: "#8b4040",
    errorBg: "#fef2f2",
    errorBorder: "#e5a0a0",
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
    base: "rounded-md transition-colors",
    primary: `bg-[${colors.primary}] hover:bg-[${colors.primaryHover}] text-white`,
    outline: `border border-[${colors.border.primary}] text-[${colors.text.secondary}] hover:border-[${colors.text.primary}]`,
  },
  input: {
    base: `border-[${colors.border.primary}] rounded-md focus:border-[${colors.text.primary}] focus:ring-0`,
  },
  card: {
    base: `bg-white border border-[${colors.border.primary}]`,
    mock: `bg-white border border-dashed border-[${colors.border.secondary}]`,
  },
} as const;

export type ThemeColors = typeof colors;
export type ThemeSpacing = typeof spacing;
export type ThemeTypography = typeof typography;
