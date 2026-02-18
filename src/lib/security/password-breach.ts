/**
 * Password Breach Checking using HaveIBeenPwned API
 *
 * Uses k-anonymity model: only first 5 chars of SHA-1 hash are sent,
 * preserving user privacy while checking against known breaches.
 *
 * @see https://haveibeenpwned.com/API/v3#PwnedPasswords
 */

import { createHash } from "crypto";

const HIBP_API_URL = "https://api.pwnedpasswords.com/range/";
const HIBP_TIMEOUT_MS = 3000;

// Cache breach check results to avoid repeated API calls
const breachCache = new Map<string, { breached: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Check if a password has been exposed in known data breaches
 *
 * @param password - Password to check
 * @returns Object with breach status and count (if breached)
 */
export async function checkPasswordBreach(password: string): Promise<{
  breached: boolean;
  count?: number;
  error?: string;
}> {
  try {
    // Generate SHA-1 hash of password (HIBP requirement)
    const hash = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    // Check cache first
    const cached = breachCache.get(hash);
    if (cached && cached.expiresAt > Date.now()) {
      return { breached: cached.breached };
    }

    // Fetch hash suffixes from HIBP API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HIBP_TIMEOUT_MS);

    const response = await fetch(`${HIBP_API_URL}${prefix}`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ShareHouse-Security-Check",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      // Don't block signup on API errors, just log
      return { breached: false, error: "API unavailable" };
    }

    const text = await response.text();
    const lines = text.split("\n");

    // Check if our suffix exists in the response
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(":");
      if (hashSuffix?.trim() === suffix) {
        const count = parseInt(countStr?.trim() || "0", 10);

        // Cache the result
        breachCache.set(hash, { breached: true, expiresAt: Date.now() + CACHE_TTL_MS });

        return { breached: true, count };
      }
    }

    // Not found = not breached
    breachCache.set(hash, { breached: false, expiresAt: Date.now() + CACHE_TTL_MS });
    return { breached: false };

  } catch (error) {
    // On any error (timeout, network issue), don't block the user
    // Log for monitoring but allow signup to proceed
    if (error instanceof Error && error.name === "AbortError") {
      return { breached: false, error: "Timeout" };
    }
    return { breached: false, error: "Check failed" };
  }
}

/**
 * Password breach check threshold
 * Only warn if password appears in more than this many breaches
 */
export const BREACH_WARNING_THRESHOLD = 10;

/**
 * Check password and return user-friendly warning if breached
 *
 * @param password - Password to check
 * @returns Warning message if breached, null if safe
 */
export async function getPasswordBreachWarning(
  password: string
): Promise<string | null> {
  const result = await checkPasswordBreach(password);

  if (result.breached && result.count && result.count >= BREACH_WARNING_THRESHOLD) {
    return `This password has been found in ${result.count.toLocaleString()} data breaches. Please choose a different password.`;
  }

  return null;
}

/**
 * Clear breach cache (for testing)
 */
export function clearBreachCache(): void {
  breachCache.clear();
}
