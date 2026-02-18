/**
 * Formatting utility functions
 * Extracted from duplicated code across components
 */

import type { Translator } from "@/lib/i18n";

/**
 * Get initials from a name string
 * @param name - Full name string
 * @returns Uppercase initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== "string") {
    return "?";
  }

  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

/**
 * Format date to locale-aware string
 * @param dateString - ISO date string or null
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string or null
 */
export function formatDate(
  dateString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
  locale = "ja-JP"
): string | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString(locale, options);
  } catch {
    return null;
  }
}

/**
 * Calculate residence duration from move-in date
 * @param moveInDate - ISO date string of move-in date
 * @returns Human-readable duration string in Japanese
 */
export function calculateResidenceDuration(
  moveInDate: string | null | undefined,
  t: Translator
): string | null {
  if (!moveInDate) return null;

  try {
    const moveIn = new Date(moveInDate);
    if (isNaN(moveIn.getTime())) return null;

    const now = new Date();
    const months =
      (now.getFullYear() - moveIn.getFullYear()) * 12 +
      (now.getMonth() - moveIn.getMonth());

    if (months < 1) return t("profile.justMovedIn");
    if (months < 12) return t("profile.residenceMonths", { count: months });

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (remainingMonths === 0) {
      return t("profile.residenceYears", { count: years });
    }
    return t("profile.residenceYearsMonths", {
      years,
      months: remainingMonths,
    });
  } catch {
    return null;
  }
}
