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
