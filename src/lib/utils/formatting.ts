/**
 * Formatting utility functions
 * Extracted from duplicated code across components
 */

import type { Translator } from "@/lib/i18n";

interface ProfileLike {
  nickname?: string | null;
  name?: string | null;
}

/**
 * Get display name from a profile, preferring nickname over name
 * @param profile - Profile object with name/nickname fields
 * @param fallback - Fallback string if both are empty
 * @returns Display name string
 */
export function getDisplayName(
  profile: ProfileLike | null | undefined,
  fallback = ""
): string {
  if (!profile) return fallback;
  return profile.nickname ?? profile.name ?? fallback;
}

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
 * @param locale - Locale string (default: "ja-JP")
 * @returns Formatted date string or null
 */
export function formatDate(
  dateString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
  locale: string | undefined = "ja-JP"
): string | null {
  if (!dateString) return null;

  try {
    // Date-only strings (YYYY-MM-DD) are parsed as UTC by default
    // Append time component to force local-time interpretation
    const normalized =
      /^\d{4}-\d{2}-\d{2}$/.test(dateString) ? `${dateString}T00:00:00` : dateString;
    const date = new Date(normalized);
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
