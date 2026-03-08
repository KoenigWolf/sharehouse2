import { revalidatePath } from "next/cache";

/**
 * キャッシュ再検証戦略の統一管理
 *
 * アプリケーション全体のキャッシュ戦略を一元管理し、
 * 保守性とパフォーマンスを向上させます。
 */
export const CacheStrategy = {
  afterProfileUpdate: () => {
    revalidatePath("/");
    revalidatePath(`/profile/[id]`, "page");
    revalidatePath("/settings");
  },

  afterTeaTimeUpdate: () => {
    revalidatePath("/");
    revalidatePath("/tea-time");
    revalidatePath("/settings");
  },

  afterMatchUpdate: () => {
    revalidatePath("/");
    revalidatePath("/tea-time");
  },

  afterAuth: () => {
    revalidatePath("/", "layout");
  },

  afterAvatarUpdate: () => {
    revalidatePath("/");
    revalidatePath(`/profile/[id]`, "page");
    revalidatePath("/settings");
    revalidatePath("/tea-time");
  },

  afterCoverPhotoUpdate: () => {
    revalidatePath("/settings");
    revalidatePath(`/profile/[id]`, "page");
  },

  afterRoomPhotoUpdate: () => {
    revalidatePath("/room-photos");
    revalidatePath(`/profile/[id]`, "page");
    revalidatePath("/settings");
  },

  afterWifiUpdate: () => {
    revalidatePath("/info");
  },

  afterGarbageUpdate: () => {
    revalidatePath("/info");
  },

  afterBulletinUpdate: () => {
    revalidatePath("/");
    revalidatePath("/residents");
    revalidatePath("/bulletin");
  },

  afterShareUpdate: () => {
    revalidatePath("/");
    revalidatePath("/share");
  },

  afterEventUpdate: () => {
    revalidatePath("/");
    revalidatePath("/events");
  },

  clearAll: () => {
    revalidatePath("/", "layout");
  },
} as const;
