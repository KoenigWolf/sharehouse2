"use client";

import { m } from "framer-motion";
import Image from "next/image";
import { useI18n } from "@/hooks/use-i18n";
import type { RoomPhoto } from "@/domain/room-photo";
import type { Profile } from "@/domain/profile";

interface RoomPhotosGalleryProps {
  photos: (RoomPhoto & { profile: Profile | null })[];
}

/**
 * 部屋写真ギャラリーコンポーネント
 *
 * 全住人の部屋写真をグリッド表示する。
 * 各カードには写真・キャプション・投稿者のアバターと名前を表示。
 * 写真がない場合は空状態メッセージを表示する。
 *
 * @param props.photos - プロフィール付き写真の配列
 */
export function RoomPhotosGallery({ photos }: RoomPhotosGalleryProps) {
  const t = useI18n();

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <p className="text-sm text-[#737373]">{t("roomPhotos.noPhotos")}</p>
        <p className="text-xs text-[#a3a3a3] mt-2">
          {t("roomPhotos.noPhotosHint")}
        </p>
      </div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
    >
      {photos.map((photo, index) => (
        <m.div
          key={photo.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
          className="group relative bg-white border border-[#e5e5e5] overflow-hidden"
        >
          {/* 写真 */}
          <div className="relative aspect-square">
            <Image
              src={photo.photo_url}
              alt={photo.caption || t("roomPhotos.photoAlt")}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover"
            />

            {/* キャプションオーバーレイ */}
            {photo.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3 pt-8">
                <p className="text-xs text-white leading-relaxed line-clamp-2">
                  {photo.caption}
                </p>
              </div>
            )}
          </div>

          {/* 投稿者情報 */}
          <div className="flex items-center gap-2 p-2.5">
            {photo.profile?.avatar_url ? (
              <Image
                src={photo.profile.avatar_url}
                alt={photo.profile.name}
                width={20}
                height={20}
                className="rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#f5f5f3] flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] text-[#a3a3a3]">
                  {photo.profile?.name?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <span className="text-[11px] text-[#737373] truncate">
              {photo.profile?.name || t("roomPhotos.unknownUser")}
            </span>
          </div>
        </m.div>
      ))}
    </m.div>
  );
}
