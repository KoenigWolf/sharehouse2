/**
 * Accessibility utilities for consistent alt text and ARIA labels
 */

/**
 * Generate contextual alt text for images
 */
export const getImageAlt = {
  eventCover: (title: string, locale: "ja" | "en" = "ja") =>
    locale === "ja" ? `イベントカバー: ${title}` : `Event cover: ${title}`,

  profileAvatar: (name: string, locale: "ja" | "en" = "ja") =>
    locale === "ja" ? `${name}のプロフィール写真` : `${name}'s profile photo`,

  shareItemImage: (title: string, locale: "ja" | "en" = "ja") =>
    locale === "ja" ? `シェアアイテム: ${title}` : `Share item: ${title}`,

  roomPhoto: (caption: string | null, locale: "ja" | "en" = "ja") =>
    caption
      ? caption
      : locale === "ja"
        ? "ルームの写真"
        : "Room photo",
} as const;

/**
 * Generate ARIA labels for interactive elements
 */
export const getAriaLabel = {
  closeModal: (locale: "ja" | "en" = "ja") =>
    locale === "ja" ? "モーダルを閉じる" : "Close modal",

  attendEvent: (eventTitle: string, locale: "ja" | "en" = "ja") =>
    locale === "ja"
      ? `${eventTitle}に参加する`
      : `Join ${eventTitle}`,

  cancelAttendance: (eventTitle: string, locale: "ja" | "en" = "ja") =>
    locale === "ja"
      ? `${eventTitle}への参加をキャンセル`
      : `Cancel attendance for ${eventTitle}`,

  viewAttendees: (count: number, locale: "ja" | "en" = "ja") =>
    locale === "ja"
      ? `参加者${count}名を表示`
      : `View ${count} attendees`,
} as const;
