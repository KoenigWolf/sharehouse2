/**
 * Security Validation Utilities
 * Provides secure input validation and sanitization
 */

import { z } from "zod";
import { t } from "@/lib/i18n";
import { timingSafeEqual as cryptoTimingSafeEqual } from "crypto";

/**
 * UUID v4 validation regex
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 * @param id - String to validate
 * @returns true if valid UUID v4
 */
export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return UUID_REGEX.test(id);
}

/**
 * Zod schema for UUID validation
 */
export const uuidSchema = z.string().refine(isValidUUID, {
  message: t("errors.invalidIdFormat"),
});

/**
 * Validate and sanitize UUID, throwing if invalid
 * @param id - String to validate
 * @param fieldName - Field name for error messages
 * @returns Validated UUID string
 * @throws Error if invalid
 */
export function validateUUID(id: unknown, fieldName = "ID"): string {
  if (typeof id !== "string" || !isValidUUID(id)) {
    throw new Error(t("errors.invalidFieldFormat", { field: fieldName }));
  }
  return id;
}

/**
 * Check if ID is a mock profile ID
 */
export function isMockId(id: string): boolean {
  return id.startsWith("mock-");
}

/**
 * Validate ID allowing both UUID and mock IDs
 */
export function validateId(id: unknown, fieldName = "ID"): string {
  if (typeof id !== "string") {
    throw new Error(t("errors.invalidFieldFormat", { field: fieldName }));
  }

  if (isMockId(id)) {
    // Mock IDs follow pattern: mock-{number}
    if (!/^mock-\d{1,3}$/.test(id)) {
      throw new Error(t("errors.invalidFieldFormat", { field: fieldName }));
    }
    return id;
  }

  return validateUUID(id, fieldName);
}

/**
 * Sanitize HTML from string to prevent XSS
 * @param input - String to sanitize
 * @returns Sanitized string with HTML entities escaped
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== "string") return "";

  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };

  return input.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Remove HTML tags from string
 * @param input - String with potential HTML
 * @returns String with HTML tags removed
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize string for database storage
 * Removes dangerous characters while preserving readability
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeForStorage(input: string): string {
  if (!input || typeof input !== "string") return "";

  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove script-like patterns
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    // Normalize whitespace
    .replace(/\s+/g, " ");
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== "string") return "";

  return email.toLowerCase().trim().slice(0, 255);
}

/**
 * Check if string contains potential SQL injection patterns
 * @param input - String to check
 * @returns true if suspicious patterns found
 */
export function hasSqlInjectionPattern(input: string): boolean {
  if (!input || typeof input !== "string") return false;

  // 正規化: 大文字化、連続空白を単一空白に
  const normalized = input.toUpperCase().replace(/\s+/g, " ");

  const sqlPatterns = [
    // DML/DDL キーワード（典型的な攻撃パターン）
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\s+\S/,
    /\bUNION\s+(ALL\s+)?SELECT\b/,
    /\bINTO\s+(OUTFILE|DUMPFILE)\b/,

    // 危険な関数呼び出し
    /\b(SLEEP|BENCHMARK|WAITFOR|DELAY|LOAD_FILE)\s*\(/,
    /\bCHAR\s*\(\s*\d+(\s*,\s*\d+)+\s*\)/i, // CHAR(65,66,67) - 文字列構築

    // コメント構文（攻撃的コンテキスト）
    /--\s*$/m,                      // 行末SQLコメント
    /\/\*.*\*\//,                   // ブロックコメント（完結）
    /\/\*[^*]*$/,                   // 未閉じブロックコメント

    // 論理演算子を使った条件操作
    /['"`]\s*(OR|AND)\s+['"`\d]/,   // ' OR '..., " AND 1 など
    /\b(OR|AND)\s+\d+\s*=\s*\d+/,   // OR 1=1, AND 1=1
    /\b(OR|AND)\s+['"`]\w*['"`]\s*=\s*['"`]/,  // OR 'a'='a'

    // ストアドプロシージャ（MSSQL）
    /\b(EXEC|EXECUTE)\s+\w/,
    /\bXP_\w+/,
    /\bSP_\w+\s*\(/,

    // NULL バイト・エスケープシーケンス
    /\\x00|%00/,

    // Hex エンコーディング（長い16進数列は攻撃の可能性）
    /0x[0-9a-f]{8,}/i,

    // 文字列連結による回避
    /['"`]\s*\|\|\s*['"`]/,        // '||' 連結（Oracle/PostgreSQL）
    /CONCAT\s*\([^)]*['"`]/i,      // CONCAT関数での文字列操作

    // 情報スキーマアクセス
    /INFORMATION_SCHEMA\.\w+/,
    /SYS\.(ALL_|DBA_|USER_)\w+/,
    /PG_CATALOG\.\w+/,

    // サブクエリパターン
    /\(\s*SELECT\s+\S/,
  ];

  return sqlPatterns.some((pattern) => pattern.test(normalized));
}

/**
 * Validate content doesn't contain injection patterns
 * @param input - String to validate
 * @param fieldName - Field name for error (uses i18n fallback if not provided)
 * @returns Validated string
 * @throws Error if suspicious patterns found
 */
export function validateNoInjection(input: string, fieldName?: string): string {
  if (hasSqlInjectionPattern(input)) {
    const field = fieldName ?? t("common.input");
    throw new Error(t("errors.invalidCharacters", { field }));
  }
  return input;
}

/**
 * Safe JSON parse with error handling
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed value or fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Mask sensitive data for logging
 * @param data - Data to mask
 * @param fields - Fields to mask
 * @returns Data with specified fields masked
 */
export function maskSensitiveData<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): T {
  const masked = { ...data };
  for (const field of fields) {
    if (field in masked && masked[field]) {
      const value = String(masked[field]);
      if (value.length > 4) {
        masked[field] = `${value.slice(0, 2)}***${value.slice(-2)}` as T[keyof T];
      } else {
        masked[field] = "***" as T[keyof T];
      }
    }
  }
  return masked;
}

/**
 * Validate request origin for CSRF protection
 * @param requestOrigin - Origin header from request
 * @param allowedOrigins - List of allowed origins
 * @returns true if origin is allowed
 */
export function validateOrigin(
  requestOrigin: string | null,
  allowedOrigins: string[]
): boolean {
  if (!requestOrigin) return false;

  try {
    const origin = new URL(requestOrigin);
    return allowedOrigins.some((allowed) => {
      const allowedUrl = new URL(allowed);
      return origin.host === allowedUrl.host;
    });
  } catch {
    return false;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 * Uses Node.js crypto.timingSafeEqual for constant-time comparison
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  // Create UTF-8 buffers first to compare actual byte lengths
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  // Different byte lengths are always unequal (but we still do constant-time work)
  if (bufA.length !== bufB.length) {
    // Perform dummy comparison to prevent timing leaks
    cryptoTimingSafeEqual(bufA, bufA);
    return false;
  }

  return cryptoTimingSafeEqual(bufA, bufB);
}

/**
 * Validate CRON secret with timing-safe comparison
 *
 * @param authHeader - Authorization header value
 * @returns true if valid CRON secret
 */
export function validateCronSecret(authHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader) {
    return false;
  }

  const expected = `Bearer ${cronSecret}`;
  return timingSafeEqual(authHeader, expected);
}
