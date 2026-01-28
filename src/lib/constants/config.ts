/**
 * Application configuration constants
 */

// File upload configuration
export const FILE_UPLOAD = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  maxSizeMB: 5,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"] as const,
} as const;

// Tea Time matching configuration
export const TEA_TIME = {
  matchHistoryDays: 30,
  matchingWeights: {
    neverMatched: 10,
    matchedOnce: 5,
    matchedMultiple: 1,
  },
  maxMatchesDisplay: 10,
} as const;

// Profile configuration
export const PROFILE = {
  maxInterestsDisplay: {
    card: 2,
    preview: 3,
  },
  nameMaxLength: 100,
  bioMaxLength: 500,
  roomNumberMaxLength: 10,
} as const;

// Share house configuration
export const SHARE_HOUSE = {
  totalRooms: 20,
  roomNumberPrefix: "",
} as const;

// Authentication configuration
export const AUTH = {
  sessionExpirationHours: 24, // 24時間（セキュリティ向上のため1週間から短縮）
  passwordMinLength: 10, // OWASP recommends 10+ characters
  passwordMaxLength: 128,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
} as const;

// Pagination configuration
export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

// Security: Rate limiting configuration
export const RATE_LIMIT = {
  auth: {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  api: {
    maxRequestsPerMinute: 60,
  },
  upload: {
    maxUploadsPerHour: 10,
  },
} as const;

// Cache configuration
export const CACHE = {
  profileTTLSeconds: 60,
  matchesTTLSeconds: 30,
} as const;

// Room photos configuration
export const ROOM_PHOTOS = {
  maxPhotosPerUser: 5,
  maxSizeBytes: 5 * 1024 * 1024,
  maxSizeMB: 5,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
} as const;

// Garbage schedule configuration
export const GARBAGE = {
  dutyRotationWeeks: 4,
  reminderHoursBefore: 12,
} as const;

// Type exports
export type FileUploadConfig = typeof FILE_UPLOAD;
export type TeaTimeConfig = typeof TEA_TIME;
export type ProfileConfig = typeof PROFILE;
