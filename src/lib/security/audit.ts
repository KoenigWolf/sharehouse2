/**
 * Security Audit Logging
 * Tracks security-sensitive operations for compliance and incident response
 */

import { maskSensitiveData } from "./validation";

/**
 * Audit event types
 */
export const AuditEventType = {
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILURE: "AUTH_LOGIN_FAILURE",
  AUTH_LOGOUT: "AUTH_LOGOUT",
  AUTH_SIGNUP: "AUTH_SIGNUP",
  AUTH_PASSWORD_CHANGE: "AUTH_PASSWORD_CHANGE",
  AUTH_EMAIL_CHANGE: "AUTH_EMAIL_CHANGE",
  AUTH_ACCOUNT_DELETE: "AUTH_ACCOUNT_DELETE",
  AUTH_RATE_LIMITED: "AUTH_RATE_LIMITED",
  AUTH_PASSWORD_RESET_REQUEST: "AUTH_PASSWORD_RESET_REQUEST",
  AUTH_PASSWORD_RESET_COMPLETE: "AUTH_PASSWORD_RESET_COMPLETE",

  PROFILE_UPDATE: "PROFILE_UPDATE",
  PROFILE_VIEW: "PROFILE_VIEW",
  AVATAR_UPLOAD: "AVATAR_UPLOAD",
  AVATAR_DELETE: "AVATAR_DELETE",

  DATA_EXPORT: "DATA_EXPORT",
  DATA_DELETE: "DATA_DELETE",

  SECURITY_SUSPICIOUS_ACTIVITY: "SECURITY_SUSPICIOUS_ACTIVITY",
  SECURITY_VALIDATION_FAILURE: "SECURITY_VALIDATION_FAILURE",
  SECURITY_UNAUTHORIZED_ACCESS: "SECURITY_UNAUTHORIZED_ACCESS",

  TEA_TIME_SETTING_CHANGE: "TEA_TIME_SETTING_CHANGE",
  TEA_TIME_MATCH_UPDATE: "TEA_TIME_MATCH_UPDATE",

  ROOM_PHOTO_UPLOAD: "ROOM_PHOTO_UPLOAD",
  ROOM_PHOTO_DELETE: "ROOM_PHOTO_DELETE",

  WIFI_CREATE: "WIFI_CREATE",
  WIFI_UPDATE: "WIFI_UPDATE",
  WIFI_DELETE: "WIFI_DELETE",

  GARBAGE_SCHEDULE_CREATE: "GARBAGE_SCHEDULE_CREATE",
  GARBAGE_SCHEDULE_UPDATE: "GARBAGE_SCHEDULE_UPDATE",
  GARBAGE_SCHEDULE_DELETE: "GARBAGE_SCHEDULE_DELETE",
  GARBAGE_DUTY_ASSIGN: "GARBAGE_DUTY_ASSIGN",
  GARBAGE_DUTY_COMPLETE: "GARBAGE_DUTY_COMPLETE",
  GARBAGE_ROTATION_GENERATE: "GARBAGE_ROTATION_GENERATE",
} as const;

export type AuditEventTypeValue =
  (typeof AuditEventType)[keyof typeof AuditEventType];

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  timestamp: string;
  eventType: AuditEventTypeValue;
  userId?: string;
  targetId?: string;
  action: string;
  outcome: "success" | "failure";
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

/**
 * Severity levels for audit events
 */
export const AuditSeverity = {
  INFO: "INFO",
  WARNING: "WARNING",
  ERROR: "ERROR",
  CRITICAL: "CRITICAL",
} as const;

type AuditSeverityValue = (typeof AuditSeverity)[keyof typeof AuditSeverity];

/**
 * Get severity level for event type
 */
function getSeverity(eventType: AuditEventTypeValue): AuditSeverityValue {
  const severityMap: Record<AuditEventTypeValue, AuditSeverityValue> = {
    [AuditEventType.AUTH_LOGIN_SUCCESS]: AuditSeverity.INFO,
    [AuditEventType.AUTH_LOGIN_FAILURE]: AuditSeverity.WARNING,
    [AuditEventType.AUTH_LOGOUT]: AuditSeverity.INFO,
    [AuditEventType.AUTH_SIGNUP]: AuditSeverity.INFO,
    [AuditEventType.AUTH_PASSWORD_CHANGE]: AuditSeverity.WARNING,
    [AuditEventType.AUTH_EMAIL_CHANGE]: AuditSeverity.WARNING,
    [AuditEventType.AUTH_ACCOUNT_DELETE]: AuditSeverity.CRITICAL,
    [AuditEventType.AUTH_RATE_LIMITED]: AuditSeverity.WARNING,
    [AuditEventType.AUTH_PASSWORD_RESET_REQUEST]: AuditSeverity.INFO,
    [AuditEventType.AUTH_PASSWORD_RESET_COMPLETE]: AuditSeverity.WARNING,
    [AuditEventType.PROFILE_UPDATE]: AuditSeverity.INFO,
    [AuditEventType.PROFILE_VIEW]: AuditSeverity.INFO,
    [AuditEventType.AVATAR_UPLOAD]: AuditSeverity.INFO,
    [AuditEventType.AVATAR_DELETE]: AuditSeverity.INFO,
    [AuditEventType.DATA_EXPORT]: AuditSeverity.WARNING,
    [AuditEventType.DATA_DELETE]: AuditSeverity.WARNING,
    [AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY]: AuditSeverity.CRITICAL,
    [AuditEventType.SECURITY_VALIDATION_FAILURE]: AuditSeverity.WARNING,
    [AuditEventType.SECURITY_UNAUTHORIZED_ACCESS]: AuditSeverity.CRITICAL,
    [AuditEventType.TEA_TIME_SETTING_CHANGE]: AuditSeverity.INFO,
    [AuditEventType.TEA_TIME_MATCH_UPDATE]: AuditSeverity.INFO,
    [AuditEventType.ROOM_PHOTO_UPLOAD]: AuditSeverity.INFO,
    [AuditEventType.ROOM_PHOTO_DELETE]: AuditSeverity.INFO,
    [AuditEventType.WIFI_CREATE]: AuditSeverity.INFO,
    [AuditEventType.WIFI_UPDATE]: AuditSeverity.INFO,
    [AuditEventType.WIFI_DELETE]: AuditSeverity.WARNING,
    [AuditEventType.GARBAGE_SCHEDULE_CREATE]: AuditSeverity.INFO,
    [AuditEventType.GARBAGE_SCHEDULE_UPDATE]: AuditSeverity.INFO,
    [AuditEventType.GARBAGE_SCHEDULE_DELETE]: AuditSeverity.WARNING,
    [AuditEventType.GARBAGE_DUTY_ASSIGN]: AuditSeverity.INFO,
    [AuditEventType.GARBAGE_DUTY_COMPLETE]: AuditSeverity.INFO,
    [AuditEventType.GARBAGE_ROTATION_GENERATE]: AuditSeverity.WARNING,
  };

  return severityMap[eventType] || AuditSeverity.INFO;
}

/**
 * Format audit log entry for output
 */
function formatAuditLog(entry: AuditLogEntry): string {
  const severity = getSeverity(entry.eventType);
  const maskedMetadata = entry.metadata
    ? maskSensitiveData(entry.metadata as Record<string, unknown>, [
        "password",
        "token",
        "secret",
        "apiKey",
      ])
    : undefined;

  const logData = {
    ...entry,
    severity,
    metadata: maskedMetadata,
  };

  return JSON.stringify(logData);
}

/**
 * Write audit log entry
 * In production, this should write to a secure, tamper-evident log store
 */
export function auditLog(entry: AuditLogEntry): void {
  const formattedLog = formatAuditLog({
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  });

  const severity = getSeverity(entry.eventType);

  switch (severity) {
    case AuditSeverity.CRITICAL:
      console.error(`[AUDIT:CRITICAL] ${formattedLog}`);
      break;
    case AuditSeverity.ERROR:
      console.error(`[AUDIT:ERROR] ${formattedLog}`);
      break;
    case AuditSeverity.WARNING:
      console.warn(`[AUDIT:WARNING] ${formattedLog}`);
      break;
    default:
      console.info(`[AUDIT:INFO] ${formattedLog}`);
  }

  // In production, also send to:
  // - Centralized logging service (e.g., CloudWatch, Datadog)
  // - SIEM system
  // - Database audit table
}

/**
 * Create audit logger with pre-filled context
 */
export function createAuditLogger(context: {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return {
    log: (
      eventType: AuditEventTypeValue,
      action: string,
      outcome: "success" | "failure",
      details?: {
        targetId?: string;
        metadata?: Record<string, unknown>;
        errorMessage?: string;
      }
    ) => {
      auditLog({
        timestamp: new Date().toISOString(),
        eventType,
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        action,
        outcome,
        ...details,
      });
    },

    success: (
      eventType: AuditEventTypeValue,
      action: string,
      metadata?: Record<string, unknown>
    ) => {
      auditLog({
        timestamp: new Date().toISOString(),
        eventType,
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        action,
        outcome: "success",
        metadata,
      });
    },

    failure: (
      eventType: AuditEventTypeValue,
      action: string,
      errorMessage: string,
      metadata?: Record<string, unknown>
    ) => {
      auditLog({
        timestamp: new Date().toISOString(),
        eventType,
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        action,
        outcome: "failure",
        errorMessage,
        metadata,
      });
    },
  };
}

/**
 * Quick audit functions for common events
 */
export const AuditActions = {
  loginSuccess: (userId: string, ipAddress?: string) => {
    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.AUTH_LOGIN_SUCCESS,
      userId,
      action: "User logged in",
      outcome: "success",
      ipAddress,
    });
  },

  loginFailure: (email: string, reason: string, ipAddress?: string) => {
    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.AUTH_LOGIN_FAILURE,
      action: "Login attempt failed",
      outcome: "failure",
      errorMessage: reason,
      ipAddress,
      metadata: { email: email.slice(0, 3) + "***" },
    });
  },

  rateLimited: (identifier: string, endpoint: string, ipAddress?: string) => {
    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.AUTH_RATE_LIMITED,
      action: `Rate limit exceeded on ${endpoint}`,
      outcome: "failure",
      ipAddress,
      metadata: { identifier: identifier.slice(0, 5) + "***", endpoint },
    });
  },

  suspiciousActivity: (
    description: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ) => {
    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY,
      userId,
      action: description,
      outcome: "failure",
      metadata,
    });
  },

  unauthorizedAccess: (
    userId: string,
    targetResource: string,
    ipAddress?: string
  ) => {
    auditLog({
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.SECURITY_UNAUTHORIZED_ACCESS,
      userId,
      action: `Unauthorized access attempt to ${targetResource}`,
      outcome: "failure",
      ipAddress,
    });
  },
};
