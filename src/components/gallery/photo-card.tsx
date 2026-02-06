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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1],
        delay: animationDelay,
      }}
      aria-label={t("roomPhotos.photoAlt")}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className="group relative w-full aspect-square overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset bg-slate-200"
        aria-label={`${t("roomPhotos.photoAlt")} - ${userName}`}
      >
        <Image
          src={photo.photo_url}
          alt=""
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover object-center"
          loading={isEagerLoad ? "eager" : "lazy"}
          priority={isEagerLoad}
        />

        {/* Instagram-style hover overlay */}
        <div
          className="absolute inset-0 bg-black/0 group-hover:bg-black/40 group-focus-visible:bg-black/40 transition-colors duration-200 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 flex items-center gap-2">
            <Avatar className="w-7 h-7 rounded-full ring-2 ring-white/80 shadow-lg">
              <OptimizedAvatarImage
                src={photo.profile?.avatar_url}
                alt=""
                context="card"
                fallback={getInitials(photo.profile?.name ?? "?")}
                fallbackClassName="bg-white text-slate-600 text-[10px] font-bold"
              />
            </Avatar>
            <span className="text-[13px] text-white font-semibold drop-shadow-lg max-w-[120px] truncate">
              {userName}
            </span>
          </div>
        </div>
      </div>
    </m.article>
  );
});

PhotoCard.displayName = "PhotoCard";
