/**
 * Security Module
 * Central export for all security utilities
 */

export {
  checkRateLimit,
  checkRateLimitAsync,
  RateLimiters,
  formatRateLimitError,
  clearRateLimitStore,
  type RateLimitConfig,
  type RateLimitResult,
} from "./rate-limit";

export {
  isValidUUID,
  uuidSchema,
  validateUUID,
  validateId,
  isMockId,
  sanitizeHtml,
  stripHtml,
  sanitizeForStorage,
  sanitizeEmail,
  maskSensitiveData,
  validateOrigin,
  timingSafeEqual,
  validateCronSecret,
} from "./validation";

export {
  auditLog,
  createAuditLogger,
  AuditActions,
  AuditEventType,
  AuditSeverity,
  type AuditLogEntry,
  type AuditEventTypeValue,
} from "./audit";

export {
  checkPasswordBreach,
  getPasswordBreachWarning,
  BREACH_WARNING_THRESHOLD,
  clearBreachCache,
} from "./password-breach";

export {
  checkAccountLockout,
  recordFailedLogin,
  recordSuccessfulLogin,
  clearLockoutStore,
} from "./account-lockout";
