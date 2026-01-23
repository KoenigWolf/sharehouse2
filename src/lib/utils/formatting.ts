/**
 * Formatting utility functions
 * Extracted from duplicated code across components
 */

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
 * Format date to Japanese locale string
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
  }
): string | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("ja-JP", options);
  } catch {
    return null;
  }
}

/**
 * Format date to short format (month/day only)
 * @param dateString - ISO date string
 * @returns Short formatted date string
 */
export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/**
 * Calculate residence duration from move-in date
 * @param moveInDate - ISO date string of move-in date
 * @returns Human-readable duration string in Japanese
 */
export function calculateResidenceDuration(
  moveInDate: string | null | undefined
): string | null {
  if (!moveInDate) return null;

  try {
    const moveIn = new Date(moveInDate);
    if (isNaN(moveIn.getTime())) return null;

    const now = new Date();
    const months =
      (now.getFullYear() - moveIn.getFullYear()) * 12 +
      (now.getMonth() - moveIn.getMonth());

    if (months < 1) return "入居したばかり";
    if (months < 12) return `${months}ヶ月`;

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (remainingMonths === 0) return `${years}年`;
    return `${years}年${remainingMonths}ヶ月`;
  } catch {
    return null;
  }
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Parse comma-separated interests string into array
 * @param interestsString - Comma-separated interests
 * @returns Array of trimmed, non-empty interest strings
 */
export function parseInterests(interestsString: string): string[] {
  if (!interestsString) return [];

  return interestsString
    .split(/[,、]/)
    .map((interest) => interest.trim())
    .filter((interest) => interest.length > 0);
}

/**
 * Format interests array back to string
 * @param interests - Array of interests
 * @returns Comma-separated string
 */
export function formatInterests(interests: string[]): string {
  return interests.filter(Boolean).join(", ");
}
