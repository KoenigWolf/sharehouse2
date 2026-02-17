import { useSyncExternalStore } from "react";

// Get initial value for reduced motion preference
function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Server snapshot always returns false (no way to know user preference on server)
function getServerSnapshot(): boolean {
  return false;
}

// Subscribe to changes in reduced motion preference
function subscribeToReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", callback);
    return () => mediaQuery.removeEventListener("change", callback);
  }

  // Fallback for older browsers
  mediaQuery.addListener(callback);
  return () => mediaQuery.removeListener(callback);
}

/**
 * Hook to detect user's reduced motion preference.
 * Respects the `prefers-reduced-motion` media query for accessibility.
 *
 * @returns true if user prefers reduced motion, false otherwise
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 *
 * const variants = prefersReducedMotion
 *   ? {} // No animation
 *   : { initial: { opacity: 0 }, animate: { opacity: 1 } };
 * ```
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  );
}

/**
 * Get animation variants that respect reduced motion preference.
 * Returns empty variants when reduced motion is preferred.
 *
 * @param prefersReducedMotion - Whether user prefers reduced motion
 * @param variants - The original animation variants
 * @returns The variants or empty object based on preference
 */
export function getMotionVariants<T extends object>(
  prefersReducedMotion: boolean,
  variants: T
): T | Record<string, never> {
  return prefersReducedMotion ? {} : variants;
}
