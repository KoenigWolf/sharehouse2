"use client";

import { useState, useCallback, memo } from "react";
import { m } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { PhotoLightbox } from "@/components/photo-lightbox";
import type { RoomPhoto } from "@/domain/room-photo";
import type { Profile } from "@/domain/profile";

type PhotoWithProfile = RoomPhoto & { profile: Profile | null };

interface RoomPhotosGalleryProps {
  photos: PhotoWithProfile[];
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

interface PhotoCardProps {
  photo: PhotoWithProfile;
  index: number;
  onClick: () => void;
}

const PhotoCard = memo(function PhotoCard({ photo, index, onClick }: PhotoCardProps) {
  const t = useI18n();

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={onClick}
        className="group w-full h-auto p-0 bg-white border border-[#e5e5e5] overflow-hidden hover:border-[#1a1a1a] hover:bg-white text-left"
      >
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={photo.photo_url}
            alt={photo.caption || t("roomPhotos.photoAlt")}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/90 text-[#1a1a1a]">
              <ExpandIcon />
            </span>
          </div>

          {photo.caption && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
              <p className="text-xs text-white leading-relaxed line-clamp-2">
                {photo.caption}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 p-2.5 border-t border-[#e5e5e5]">
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
      </Button>
    </m.div>
  );
});

PhotoCard.displayName = "PhotoCard";

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  count?: number;
}

const SectionHeader = memo(function SectionHeader({ icon, title, count }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[#a3a3a3]">{icon}</span>
      <h2 className="text-xs text-[#a3a3a3] tracking-wide uppercase">{title}</h2>
      {count !== undefined && (
        <span className="text-[10px] text-[#a3a3a3] font-mono ml-auto">
          {count}
        </span>
      )}
    </div>
  );
});

SectionHeader.displayName = "SectionHeader";

/**
 * 部屋写真ギャラリーコンポーネント
 *
 * 全住人の部屋写真をグリッド表示し、クリックでライトボックス表示。
 * キーボードナビゲーション（矢印キー、Escape）対応。
 */
export function RoomPhotosGallery({ photos }: RoomPhotosGalleryProps) {
  const t = useI18n();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handlePhotoClick = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handleNavigate = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  if (photos.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white border border-[#e5e5e5] p-8 sm:p-12 text-center"
      >
        <div className="w-12 h-12 mx-auto mb-4 bg-[#f5f5f3] flex items-center justify-center text-[#a3a3a3]">
          <CameraIcon />
        </div>
        <p className="text-sm text-[#737373]">{t("roomPhotos.noPhotos")}</p>
        <p className="text-xs text-[#a3a3a3] mt-2">
          {t("roomPhotos.noPhotosHint")}
        </p>
      </m.div>
    );
  }

  return (
    <>
      <m.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <SectionHeader
          icon={<CameraIcon />}
          title={t("roomPhotos.gallery")}
          count={photos.length}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              onClick={() => handlePhotoClick(index)}
            />
          ))}
        </div>

        <p className="text-[10px] text-[#a3a3a3] mt-4 tracking-wide">
          {t("roomPhotos.clickToEnlarge")}
        </p>
      </m.section>

      <PhotoLightbox
        photos={photos}
        selectedIndex={selectedIndex}
        onClose={handleClose}
        onNavigate={handleNavigate}
      />
    </>
  );
}
