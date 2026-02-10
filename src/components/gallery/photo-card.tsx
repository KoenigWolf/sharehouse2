"use client";

import { memo } from "react";
import { m } from "framer-motion";
import Image from "next/image";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/hooks/use-i18n";
import { getInitials } from "@/lib/utils";
import type { PhotoWithProfile } from "@/domain/room-photo";

interface PhotoCardProps {
  photo: PhotoWithProfile;
  index: number;
  onClick: () => void;
}

/** Number of images to load eagerly for fast initial render */
const EAGER_LOAD_COUNT = 6;

/** Maximum animation delay to prevent slow page loads */
const MAX_STAGGER_INDEX = 6;

/** Stagger delay between card animations */
const STAGGER_DELAY = 0.015;

/**
 * Individual photo card in the gallery grid
 *
 * Features:
 * - Lazy loading for off-screen images
 * - Priority loading for first visible images
 * - Instagram-style hover overlay with user info
 * - Keyboard accessible (Enter/Space to activate)
 */
export const PhotoCard = memo(function PhotoCard({
  photo,
  index,
  onClick,
}: PhotoCardProps) {
  const t = useI18n();
  const isEagerLoad = index < EAGER_LOAD_COUNT;
  const animationDelay = Math.min(index, MAX_STAGGER_INDEX) * STAGGER_DELAY;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  const userName = photo.profile?.name ?? t("roomPhotos.unknownUser");

  return (
    <m.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1],
        delay: animationDelay,
      }}
      className="group relative"
      aria-label={t("roomPhotos.photoAlt")}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className="relative w-full overflow-hidden rounded-xl cursor-pointer bg-secondary shadow-sm hover:shadow-xl transition-all duration-500 ease-out outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label={`${t("roomPhotos.photoAlt")} - ${userName}`}
      >
        <Image
          src={photo.photo_url}
          alt=""
          width={500}
          height={500}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="w-full h-auto object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
          loading={isEagerLoad ? "eager" : "lazy"}
          priority={isEagerLoad}
        />

        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4"
          aria-hidden="true"
        >
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-3">
            <Avatar className="w-8 h-8 ring-2 ring-white/20 shadow-lg">
              <OptimizedAvatarImage
                src={photo.profile?.avatar_url}
                alt=""
                context="card"
                fallback={getInitials(photo.profile?.name ?? "?")}
                fallbackClassName="bg-white/10 text-white text-[10px] font-bold backdrop-blur-md"
              />
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm text-white font-medium line-clamp-1 text-shadow-sm">
                {userName}
              </span>
              {photo.caption && (
                <span className="text-[11px] text-white/80 line-clamp-1 font-light">
                  {photo.caption}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </m.article>
  );
});

PhotoCard.displayName = "PhotoCard";
