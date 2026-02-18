/**
 * Account Lockout Security Module
 *
 * Implements progressive lockout for failed login attempts:
 * - 5 failed attempts: 5 minute lockout
 * - 10 failed attempts: 30 minute lockout
 * - 15+ failed attempts: 60 minute lockout
 *
 * Uses email + IP combination as identifier to prevent:
 * - Credential stuffing attacks
 * - Brute force attacks
 * - Account enumeration
 */

import { auditLog, AuditEventType } from "./audit";

interface LockoutEntry {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

// In-memory store (can be replaced with Redis for distributed systems)
const lockoutStore = new Map<string, LockoutEntry>();

// Cleanup interval
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

// Lockout thresholds
const LOCKOUT_THRESHOLDS = [
  { attempts: 5, durationMs: 5 * 60 * 1000 },      // 5 minutes
  { attempts: 10, durationMs: 30 * 60 * 1000 },    // 30 minutes
  { attempts: 15, durationMs: 60 * 60 * 1000 },    // 60 minutes
] as const;

// Reset failed attempts after this period of no activity
const RESET_AFTER_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate lockout key from email and IP
 */
function getLockoutKey(email: string, ipAddress?: string): string {
  const sanitizedEmail = email.toLowerCase().trim();
  return ipAddress ? `${sanitizedEmail}:${ipAddress}` : sanitizedEmail;
}

/**
 * Cleanup expired entries
 */
function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  for (const [key, entry] of lockoutStore.entries()) {
    // Remove entries with no recent activity
    if (now - entry.lastAttempt > RESET_AFTER_MS) {
      lockoutStore.delete(key);
    }
  }
}

/**
 * Get lockout duration based on failed attempts
 */
function getLockoutDuration(failedAttempts: number): number {
  for (let i = LOCKOUT_THRESHOLDS.length - 1; i >= 0; i--) {
    if (failedAttempts >= LOCKOUT_THRESHOLDS[i].attempts) {
      return LOCKOUT_THRESHOLDS[i].durationMs;
    }
  }
  return 0;
}

/**
 * Check if account is locked
 *
 * @param email - User email
 * @param ipAddress - Client IP address (optional)
 * @returns Object with lock status and remaining time
 */
export function checkAccountLockout(
  email: string,
  ipAddress?: string
): {
  isLocked: boolean;
  remainingMinutes: number;
  failedAttempts: number;
} {
  cleanup();

  const key = getLockoutKey(email, ipAddress);
  const entry = lockoutStore.get(key);

  if (!entry) {
    return { isLocked: false, remainingMinutes: 0, failedAttempts: 0 };
  }

  const now = Date.now();

  // Reset if no activity for a long time
  if (now - entry.lastAttempt > RESET_AFTER_MS) {
    lockoutStore.delete(key);
    return { isLocked: false, remainingMinutes: 0, failedAttempts: 0 };
  }

  // Check if currently locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    const remainingMs = entry.lockedUntil - now;
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return {
      isLocked: true,
      remainingMinutes,
      failedAttempts: entry.failedAttempts,
    };
  }

  return {
    isLocked: false,
    remainingMinutes: 0,
    failedAttempts: entry.failedAttempts,
  };
}

/**
 * Record a failed login attempt
 *
 * @param email - User email
 * @param ipAddress - Client IP address (optional)
 * @returns Updated lockout status
 */
export function recordFailedLogin(
  email: string,
  ipAddress?: string
): {
  isLocked: boolean;
  remainingMinutes: number;
  failedAttempts: number;
} {
  const key = getLockoutKey(email, ipAddress);
  const now = Date.now();
  const entry = lockoutStore.get(key);

  const newEntry: LockoutEntry = {
    failedAttempts: (entry?.failedAttempts ?? 0) + 1,
    lastAttempt: now,
    lockedUntil: null,
  };

  // Determine if lockout should be applied
  const lockoutDuration = getLockoutDuration(newEntry.failedAttempts);
  if (lockoutDuration > 0) {
    newEntry.lockedUntil = now + lockoutDuration;

    // Audit log for lockout
    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY,
      action: `Account locked after ${newEntry.failedAttempts} failed attempts`,
      outcome: "failure",
      ipAddress: ipAddress ?? undefined,
      metadata: {
        email: email.slice(0, 3) + "***",
        failedAttempts: newEntry.failedAttempts,
        lockoutMinutes: Math.ceil(lockoutDuration / 60000),
      },
    });
  }

  lockoutStore.set(key, newEntry);

  if (newEntry.lockedUntil) {
    const remainingMs = newEntry.lockedUntil - now;
    return {
      isLocked: true,
      remainingMinutes: Math.ceil(remainingMs / 60000),
      failedAttempts: newEntry.failedAttempts,
    };
  }

  return {
    isLocked: false,
    remainingMinutes: 0,
    failedAttempts: newEntry.failedAttempts,
  };
}

/**
 * Record a successful login (resets failed attempts)
 *
 * @param email - User email
 * @param ipAddress - Client IP address (optional)
 */
export function recordSuccessfulLogin(
  email: string,
  ipAddress?: string
): void {
  const key = getLockoutKey(email, ipAddress);
  lockoutStore.delete(key);
}

/**
 * Clear lockout store (for testing)
 */
export function clearLockoutStore(): void {
  lockoutStore.clear();
}
