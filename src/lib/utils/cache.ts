import { revalidatePath } from "next/cache";

/**
 * キャッシュ再検証戦略の統一管理
 *
 * アプリケーション全体のキャッシュ戦略を一元管理し、
 * 保守性とパフォーマンスを向上させます。
 */
export const CacheStrategy = {
  /**
   * プロフィール更新後のキャッシュ再検証
   */
  afterProfileUpdate: () => {
    revalidatePath("/"); // ホームページ（住民一覧）
    revalidatePath(`/profile/[id]`, "page"); // プロフィール詳細（動的）
    revalidatePath("/settings"); // 設定ページ
  },

  /**
   * ティータイム設定更新後のキャッシュ再検証
   */
  afterTeaTimeUpdate: () => {
    revalidatePath("/"); // ホームページ（通知表示）
    revalidatePath("/tea-time"); // ティータイムページ
    revalidatePath("/settings"); // 設定ページ
  },

  /**
   * ティータイムマッチ更新後のキャッシュ再検証
   */
  afterMatchUpdate: () => {
    revalidatePath("/"); // ホームページ（通知表示）
    revalidatePath("/tea-time"); // ティータイムページ
  },

  /**
   * 認証後のキャッシュ再検証
   */
  afterAuth: () => {
    revalidatePath("/", "layout"); // 全体のレイアウトをリフレッシュ
  },

  /**
   * アバター更新後のキャッシュ再検証
   */
  afterAvatarUpdate: () => {
    revalidatePath("/"); // ホームページ（住民一覧）
    revalidatePath(`/profile/[id]`, "page"); // プロフィール詳細
    revalidatePath("/settings"); // 設定ページ
    revalidatePath("/tea-time"); // ティータイムページ（アバター表示あり）
  },

  /**
   * 部屋写真更新後のキャッシュ再検証
   */
  afterRoomPhotoUpdate: () => {
    revalidatePath("/room-photos");
    revalidatePath(`/profile/[id]`, "page");
    revalidatePath("/settings");
  },

  /**
   * Wi-Fi情報更新後のキャッシュ再検証
   */
  afterWifiUpdate: () => {
    revalidatePath("/info");
  },

  /**
   * ゴミ出しスケジュール・当番更新後のキャッシュ再検証
   */
  afterGarbageUpdate: () => {
    revalidatePath("/info");
  },

  /**
   * 全体キャッシュクリア（管理用・緊急時）
   */
  clearAll: () => {
    revalidatePath("/", "layout");
  },
} as const;
