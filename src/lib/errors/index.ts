/**
 * Error handling utilities
 * Provides consistent error handling across the application
 */

import { createHash } from "crypto";
import { t } from "@/lib/i18n";
import { AUTH } from "@/lib/constants/config";

/**
 * Application error codes
 */
export const ErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  WEAK_PASSWORD: "WEAK_PASSWORD",
  EMAIL_NOT_CONFIRMED: "EMAIL_NOT_CONFIRMED",

  INVALID_INPUT: "INVALID_INPUT",
  REQUIRED_FIELD: "REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",

  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",

  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",

  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  UPLOAD_FAILED: "UPLOAD_FAILED",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Application error class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCodeType,
    message?: string,
    public details?: Record<string, unknown>
  ) {
    super(message || getErrorMessage(code));
    this.name = "AppError";
  }
}

/**
 * Get localized error message for error code
 */
export function getErrorMessage(code: ErrorCodeType): string {
  const messages: Record<ErrorCodeType, string> = {
    [ErrorCode.UNAUTHORIZED]: t("errors.unauthorized"),
    [ErrorCode.INVALID_CREDENTIALS]: t("auth.invalidCredentials"),
    [ErrorCode.EMAIL_ALREADY_EXISTS]: t("auth.emailAlreadyExists"),
    [ErrorCode.WEAK_PASSWORD]: t("auth.passwordMinLength", {
      min: AUTH.passwordMinLength,
    }),
    [ErrorCode.EMAIL_NOT_CONFIRMED]: t("auth.confirmationEmailSent"),
    [ErrorCode.INVALID_INPUT]: t("errors.invalidInput"),
    [ErrorCode.REQUIRED_FIELD]: t("errors.invalidInput"),
    [ErrorCode.INVALID_FORMAT]: t("errors.invalidInput"),
    [ErrorCode.NOT_FOUND]: t("errors.notFound"),
    [ErrorCode.FORBIDDEN]: t("errors.forbidden"),
    [ErrorCode.CONFLICT]: t("errors.saveFailed"),
    [ErrorCode.INTERNAL_ERROR]: t("errors.serverError"),
    [ErrorCode.DATABASE_ERROR]: t("errors.serverError"),
    [ErrorCode.NETWORK_ERROR]: t("errors.networkError"),
    [ErrorCode.FILE_TOO_LARGE]: t("errors.fileTooLarge"),
    [ErrorCode.INVALID_FILE_TYPE]: t("errors.invalidFileType"),
    [ErrorCode.UPLOAD_FAILED]: t("errors.uploadFailed"),
  };

  return messages[code] || t("errors.unknownError");
}

/**
 * Standard API response type
 */
export type ApiResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ErrorCodeType };

/**
 * Create success response
 */
export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

/**
 * Create error response
 */
export function error(
  message: string,
  code?: ErrorCodeType
): ApiResponse<never> {
  return { success: false, error: message, code };
}

/**
 * Handle unknown error and return consistent format
 */
export function handleError(err: unknown): { error: string; code?: ErrorCodeType } {
  if (err instanceof AppError) {
    return { error: err.message, code: err.code };
  }

  if (err instanceof Error) {
    if (err.message.includes("already registered")) {
      return { error: t("auth.emailAlreadyExists"), code: ErrorCode.EMAIL_ALREADY_EXISTS };
    }
    if (err.message.includes("Invalid login")) {
      return { error: t("auth.invalidCredentials"), code: ErrorCode.INVALID_CREDENTIALS };
    }

    return { error: err.message };
  }

  return { error: t("errors.unknownError"), code: ErrorCode.INTERNAL_ERROR };
}

/**
 * Sentryにエラー/警告を送信する（内部ヘルパー）
 */
/**
 * Sensitive keys that should be redacted before sending to Sentry
 */
const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "authorization",
  "cookie",
  "session",
  "creditCard",
  "credit_card",
  "ssn",
  "email",
  "phone",
  "address",
];

const MAX_SANITIZE_DEPTH = 10;

/**
 * Sanitize metadata before sending to Sentry
 * Redacts sensitive information to prevent PII leakage
 *
 * @param data - Object to sanitize
 * @param depth - Current recursion depth (internal use)
 */
function sanitizeForSentry(
  data: Record<string, unknown>,
  depth = 0
): Record<string, unknown> {
  // Prevent stack overflow from deeply nested objects
  if (depth >= MAX_SANITIZE_DEPTH) {
    return { "[max_depth_exceeded]": true };
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive patterns
    const isSensitive = SENSITIVE_KEYS.some(
      (sensitiveKey) =>
        lowerKey.includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (Array.isArray(value)) {
      // Handle arrays
      sanitized[key] = value.slice(0, 20).map((item) =>
        typeof item === "object" && item !== null
          ? sanitizeForSentry(item as Record<string, unknown>, depth + 1)
          : item
      );
    } else if (typeof value === "object" && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeForSentry(value as Record<string, unknown>, depth + 1);
    } else if (typeof value === "string" && value.length > 100) {
      // Truncate long strings
      sanitized[key] = value.slice(0, 100) + "...[truncated]";
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Hash user ID for Sentry to prevent PII leakage
 * Uses SHA-256 and takes first 12 chars of hex output
 */
function hashUserId(userId: string): string {
  return createHash("sha256").update(userId).digest("hex").slice(0, 12);
}

/**
 * Redact sensitive patterns from error message
 */
function redactErrorMessage(message: string): string {
  let redacted = message;

  // Redact email patterns
  redacted = redacted.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "[EMAIL]"
  );

  // Redact potential tokens/secrets (long alphanumeric strings)
  redacted = redacted.replace(
    /\b[a-zA-Z0-9]{32,}\b/g,
    "[REDACTED]"
  );

  // Redact UUIDs
  redacted = redacted.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    "[UUID]"
  );

  return redacted;
}

async function sendToSentry(
  error: unknown,
  errorData: Record<string, unknown>,
  context?: {
    action?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  },
  level: "error" | "warning" = "error"
): Promise<void> {
  const Sentry = await import("@sentry/nextjs");
  if (!Sentry.isInitialized()) return;

  Sentry.withScope((scope) => {
    if (context?.action) {
      scope.setTag("action", context.action);
    }
    if (context?.userId) {
      // Use SHA-256 hash to prevent PII correlation
      scope.setUser({ id: `user_${hashUserId(context.userId)}` });
    }
    if (context?.metadata) {
      scope.setExtra("metadata", sanitizeForSentry(context.metadata));
    }

    if (error instanceof Error) {
      // Redact sensitive data from error message before sending
      const sanitizedError = new Error(redactErrorMessage(error.message));
      sanitizedError.name = error.name;
      sanitizedError.stack = error.stack;
      Sentry.captureException(sanitizedError);
    } else {
      Sentry.captureMessage(
        typeof error === "string" ? redactErrorMessage(error) : JSON.stringify(sanitizeForSentry(errorData)),
        level
      );
    }
  });
}

/**
 * Log error with context (for server-side use)
 *
 * Sentry DSNが設定されている場合はSentryにもエラーを送信する。
 * 設定されていない場合はコンソールログのみ出力する。
 */
export function logError(
  error: unknown,
  context?: {
    action?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const timestamp = new Date().toISOString();

  let errorData: Record<string, unknown>;
  if (error instanceof Error) {
    errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  } else if (error && typeof error === "object") {
    errorData = { ...error } as Record<string, unknown>;
  } else {
    errorData = { message: String(error) };
  }

  const errorInfo = {
    timestamp,
    ...context,
    error: errorData,
  };

  console.error("[AppError]", JSON.stringify(errorInfo, null, 2));

  sendToSentry(error, errorData, context).catch(() => {
    // Sentry not available, skip silently
  });
}

/**
 * Log warning with context (for server-side use)
 *
 * Sentry DSNが設定されている場合はSentryにも警告を送信する。
 * 設定されていない場合はコンソールログのみ出力する。
 */
export function logWarning(
  message: string,
  context?: {
    action?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const timestamp = new Date().toISOString();

  const warningInfo = {
    timestamp,
    level: "warning",
    message,
    ...context,
  };

  console.warn("[AppWarning]", JSON.stringify(warningInfo, null, 2));

  sendToSentry(message, { message }, context, "warning").catch(() => {
    // Sentry not available, skip silently
  });
}

/**
 * Log info with context (for server-side use)
 *
 * Info level logs are not sent to Sentry, only to console.
 */
export function logInfo(
  message: string,
  context?: {
    action?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const timestamp = new Date().toISOString();

  const infoData = {
    timestamp,
    level: "info",
    message,
    ...context,
  };

  console.info("[AppInfo]", JSON.stringify(infoData, null, 2));
}
