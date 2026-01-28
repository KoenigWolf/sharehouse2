/**
 * Security Module
 * Central export for all security utilities
 */

// Rate limiting
export {
  checkRateLimit,
  checkRateLimitAsync,
  RateLimiters,
  getRateLimitHeaders,
  formatRateLimitError,
  clearRateLimitStore,
  type RateLimitConfig,
  type RateLimitResult,
} from "./rate-limit";

// Validation
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
  hasSqlInjectionPattern,
  validateNoInjection,
  safeJsonParse,
  maskSensitiveData,
  validateOrigin,
} from "./validation";

// Audit logging
export {
  auditLog,
  createAuditLogger,
  AuditActions,
  AuditEventType,
  AuditSeverity,
  type AuditLogEntry,
  type AuditEventTypeValue,
} from "./audit";
