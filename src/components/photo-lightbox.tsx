"use client";

import { useEffect, useCallback, useState, memo } from "react";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/use-i18n";
import type { RoomPhoto } from "@/domain/room-photo";
import type { Profile } from "@/domain/profile";

type PhotoWithProfile = RoomPhoto & { profile: Profile | null };

interface PhotoLightboxProps {
  photos: PhotoWithProfile[];
  selectedIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// key={photo.id} でマウントし直すことで isImageLoaded を自然にリセット
const LightboxImage = memo(function LightboxImage({
  photo,
}: {
  photo: PhotoWithProfile;
}) {
  const t = useI18n();
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative flex-1 flex items-center justify-center">
      <div className="relative">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size="lg" variant="light" className="border-2" />
          </div>
        )}
        <Image
          src={photo.photo_url}
          alt={photo.caption || t("roomPhotos.photoAlt")}
          width={1200}
          height={1200}
          className={`max-w-[90vw] max-h-[70vh] w-auto h-auto object-contain transition-opacity duration-200 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setIsLoaded(true)}
          priority
        />
      </div>
    </div>
  );
});

LightboxImage.displayName = "LightboxImage";

export function PhotoLightbox({
  photos,
  selectedIndex,
  onClose,
  onNavigate,
}: PhotoLightboxProps) {
  const t = useI18n();

  const isOpen = selectedIndex !== null;
  const photo = selectedIndex !== null ? photos[selectedIndex] : null;
  const hasPrev = selectedIndex !== null && selectedIndex > 0;
  const hasNext = selectedIndex !== null && selectedIndex < photos.length - 1;

  const handlePrev = useCallback(() => {
    if (selectedIndex !== null && selectedIndex > 0) {
      onNavigate(selectedIndex - 1);
    }
  }, [selectedIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      onNavigate(selectedIndex + 1);
    }
  }, [selectedIndex, photos.length, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          handlePrev();
          break;
        case "ArrowRight":
          handleNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && photo && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/90" />

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white/70 hover:text-white hover:bg-white/10"
            aria-label={t("common.close")}
          >
            <CloseIcon />
          </Button>

          <div className="absolute top-4 left-4 z-10 text-sm text-white/70 font-mono">
            {(selectedIndex ?? 0) + 1} / {photos.length}
          </div>

          {hasPrev && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 sm:left-4 z-10 text-white/50 hover:text-white hover:bg-white/10"
              aria-label={t("roomPhotos.prevPhoto")}
            >
              <ChevronLeftIcon />
            </Button>
          )}

          {hasNext && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 sm:right-4 z-10 text-white/50 hover:text-white hover:bg-white/10"
              aria-label={t("roomPhotos.nextPhoto")}
            >
              <ChevronRightIcon />
            </Button>
          )}

          <m.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-[90vw] max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <LightboxImage key={photo.id} photo={photo} />

            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="mt-4 px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10"
            >
              <div className="flex items-center gap-3">
                {photo.profile?.avatar_url ? (
                  <Image
                    src={photo.profile.avatar_url}
                    alt={photo.profile.name}
                    width={32}
                    height={32}
                    className="rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <span className="text-xs text-white/60">
                      {photo.profile?.name?.charAt(0) || "?"}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/90">
                    {photo.profile?.name || t("roomPhotos.unknownUser")}
                  </p>
                </div>
              </div>
            </m.div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
