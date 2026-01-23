/**
 * Error handling utilities
 * Provides consistent error handling across the application
 */

import { t } from "@/lib/i18n";

/**
 * Application error codes
 */
export const ErrorCode = {
  // Authentication errors
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  WEAK_PASSWORD: "WEAK_PASSWORD",
  EMAIL_NOT_CONFIRMED: "EMAIL_NOT_CONFIRMED",

  // Validation errors
  INVALID_INPUT: "INVALID_INPUT",
  REQUIRED_FIELD: "REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",

  // File errors
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
    [ErrorCode.WEAK_PASSWORD]: t("auth.passwordMinLength"),
    [ErrorCode.EMAIL_NOT_CONFIRMED]: t("auth.confirmationEmailSent"),
    [ErrorCode.INVALID_INPUT]: t("errors.invalidInput"),
    [ErrorCode.REQUIRED_FIELD]: t("errors.invalidInput"),
    [ErrorCode.INVALID_FORMAT]: t("errors.invalidInput"),
    [ErrorCode.NOT_FOUND]: t("errors.notFound"),
    [ErrorCode.FORBIDDEN]: t("errors.unauthorized"),
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
    // Map known error messages
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
 * Log error with context (for server-side use)
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
  const errorInfo = {
    timestamp,
    ...context,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : { message: String(error) },
  };

  // In production, this could be sent to a logging service
  console.error("[AppError]", JSON.stringify(errorInfo, null, 2));
}
