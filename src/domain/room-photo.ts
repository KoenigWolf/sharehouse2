import type { Profile } from "./profile";

/**
 * Room photo entity from database
 */
export interface RoomPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  taken_at: string | null;
  display_order: number;
  created_at: string;
}

/**
 * Room photo with associated profile data for gallery display
 */
export type PhotoWithProfile = RoomPhoto & {
  profile: Pick<Profile, "id" | "name" | "avatar_url"> | null;
};

/**
 * Lightbox navigation direction
 */
export type LightboxDirection = "prev" | "next";

/**
 * Photo gallery view mode
 */
export type GalleryViewMode = "grid" | "lightbox";

/**
 * Photo upload status for bulk upload progress
 */
export type PhotoUploadStatus =
  | "pending"
  | "compressing"
  | "uploading"
  | "done"
  | "error";

/**
 * Individual upload item for progress tracking
 */
export interface PhotoUploadItem {
  id: string;
  fileName: string;
  status: PhotoUploadStatus;
  error?: string;
}

/**
 * Photo action handlers for lightbox
 */
export interface PhotoActionHandlers {
  onDelete?: (photoId: string) => Promise<boolean>;
  onUpdateCaption?: (photoId: string, caption: string | null) => Promise<boolean>;
}
