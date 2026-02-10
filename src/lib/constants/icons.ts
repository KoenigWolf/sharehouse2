/**
 * Icon system constants for consistent icon usage across the app
 * Based on lucide-react library and ergonomic design principles
 *
 * Design Philosophy:
 * - 8px grid system for consistent rhythm
 * - Golden ratio (1.618) influenced proportions
 * - Optical balance between icon weight and text
 * - Fitts's Law compliant touch targets
 */

/** Standard icon sizes (in pixels) */
export const ICON_SIZE = {
  /** Extra small - badges, indicators (12px) */
  xs: 12,
  /** Small - inline text, compact UI (14px) */
  sm: 14,
  /** Default - buttons, form elements (16px) */
  md: 16,
  /** Large - navigation, cards (20px) */
  lg: 20,
  /** Extra large - mobile nav, touch targets (24px) */
  xl: 24,
  /** 2X large - page headers, alerts (32px) */
  "2xl": 32,
} as const;

/**
 * Icon-to-text gap based on icon size
 * Follows ~50% ratio of icon size for optical balance
 *
 * Usage: Apply as Tailwind gap class
 * - xs icon → gap-1.5 (6px)
 * - sm icon → gap-2 (8px)
 * - md icon → gap-2 (8px)
 * - lg icon → gap-2.5 (10px)
 * - xl icon → gap-3 (12px)
 * - 2xl icon → gap-4 (16px)
 */
export const ICON_GAP = {
  /** Gap for xs icons - gap-1.5 */
  xs: "gap-1.5",
  /** Gap for sm icons - gap-2 */
  sm: "gap-2",
  /** Gap for md icons - gap-2 */
  md: "gap-2",
  /** Gap for lg icons - gap-2.5 */
  lg: "gap-2.5",
  /** Gap for xl icons - gap-3 */
  xl: "gap-3",
  /** Gap for 2xl icons - gap-4 */
  "2xl": "gap-4",
} as const;

/** Gap values in pixels for reference */
export const ICON_GAP_PX = {
  xs: 6,
  sm: 8,
  md: 8,
  lg: 10,
  xl: 12,
  "2xl": 16,
} as const;

/** Standard stroke widths for different contexts */
export const ICON_STROKE = {
  /** Thin - decorative, information icons */
  thin: 1.5,
  /** Normal - standard usage */
  normal: 2,
  /** Medium - active states, emphasis */
  medium: 2.5,
  /** Bold - checkmarks, confirmations */
  bold: 3,
} as const;

/** Semantic icon color classes */
export const ICON_COLOR = {
  /** Primary foreground color */
  primary: "text-foreground",
  /** Brand color (Deep Olive) */
  brand: "text-brand-500",
  /** Muted/secondary color */
  muted: "text-muted-foreground",
  /** Error/destructive color */
  error: "text-error",
  /** Success color */
  success: "text-success",
  /** White (for dark backgrounds) */
  white: "text-white",
  /** Inherit from parent */
  inherit: "text-current",
} as const;

export type IconSize = keyof typeof ICON_SIZE;
export type IconStroke = keyof typeof ICON_STROKE;
export type IconColor = keyof typeof ICON_COLOR;
export type IconGap = keyof typeof ICON_GAP;
