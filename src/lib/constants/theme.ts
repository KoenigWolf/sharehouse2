/**
 * Theme constants for consistent styling across the application
 * Based on Muji-inspired minimalist design
 */

export const colors = {
  // Brand colors (DESIGN_GUIDELINES.md: black-based, no red)
  primary: "#272a26",
  primaryHover: "#363933",

  text: {
    primary: "#272a26",
    secondary: "#636861",
    tertiary: "#959892",
    inverse: "#fafbf9",
    placeholder: "#bdc0ba",
  },

  background: {
    primary: "#f5f6f4",
    secondary: "#eceee9",
    card: "#fafbf9",
  },

  border: {
    primary: "#dddfd9",
    secondary: "#bdc0ba",
  },

  // Status colors (DESIGN_GUIDELINES.md: muted, low-saturation)
  status: {
    success: "#4d7356",
    successBg: "#edf5ee",
    successBorder: "#8ab896",
    error: "#856259",
    errorBg: "#f9f2f0",
    errorBorder: "#c7a099",
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
