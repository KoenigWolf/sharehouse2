/**
 * Format a timestamp for display in bulletin posts
 * Uses relative time for recent posts, absolute date for older ones
 */
export function formatTimestamp(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays >= 7) {
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "narrow" });

  if (diffSecs < 60) return rtf.format(0, "second");
  if (diffMins < 60) return rtf.format(-diffMins, "minute");
  if (diffHours < 24) return rtf.format(-diffHours, "hour");
  return rtf.format(-diffDays, "day");
}

// Twitter-like spring physics for animations
export const SPRING = { type: "spring", stiffness: 500, damping: 30, mass: 1 } as const;
export const SPRING_SOFT = { type: "spring", stiffness: 300, damping: 25 } as const;
export const EASE_OUT = [0.32, 0.72, 0, 1] as const;
