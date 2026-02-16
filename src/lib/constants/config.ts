/**
 * Application configuration constants
 */

export const FILE_UPLOAD = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB (post-compression)
  maxSizeMB: 5,
  /** サーバー側で受け付ける圧縮済み形式 */
  allowedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"] as const,
  /** クライアント側 <input accept> で許可する入力形式（HEIC 等含む） */
  inputAccept:
    "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif",
} as const;

export const TEA_TIME = {
  matchHistoryDays: 30,
  matchingWeights: {
    neverMatched: 10,
    matchedOnce: 5,
    matchedMultiple: 1,
  },
  maxMatchesDisplay: 10,
} as const;

export const PROFILE = {
  maxInterestsDisplay: {
    card: 2,
    preview: 3,
  },
  nameMaxLength: 100,
  bioMaxLength: 500,
  roomNumberMaxLength: 10,
} as const;

export const SHARE_HOUSE = {
  totalRooms: 20,
  roomNumberPrefix: "",
} as const;

export const AUTH = {
  sessionExpirationHours: 24, // 24時間（セキュリティ向上のため1週間から短縮）
  passwordMinLength: 10, // OWASP recommends 10+ characters
  passwordMaxLength: 128,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
} as const;

export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

export const RATE_LIMIT = {
  auth: {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  api: {
    maxRequestsPerMinute: 60,
  },
  upload: {
    maxUploadsPerHour: 100,
  },
} as const;

export const CACHE = {
  profileTTLSeconds: 60,
  matchesTTLSeconds: 30,
} as const;

export const ROOM_PHOTOS = {
  maxBulkUpload: 50,
  maxCaptionLength: 200,
  maxSizeBytes: 5 * 1024 * 1024, // post-compression
  maxSizeMB: 5,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
} as const;

export const GARBAGE = {
  dutyRotationWeeks: 4,
  reminderHoursBefore: 12,
} as const;

export const BULLETIN = {
  maxMessageLength: 200,
  maxDisplayOnHome: 5,
  maxDisplayOnBulletinPage: 100,
  pageSize: 15,
} as const;

export const SHARE_ITEMS = {
  maxTitleLength: 100,
  maxDescriptionLength: 300,
  expirationDays: 3,
} as const;

export const EVENTS = {
  maxTitleLength: 100,
  maxDescriptionLength: 500,
} as const;

export type FileUploadConfig = typeof FILE_UPLOAD;
export type TeaTimeConfig = typeof TEA_TIME;
export type ProfileConfig = typeof PROFILE;
