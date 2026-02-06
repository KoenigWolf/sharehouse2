"use client";

import { useEffect, useCallback, useState, useRef, memo } from "react";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/use-i18n";
import { getInitials } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatting";
import { ROOM_PHOTOS } from "@/lib/constants/config";
import type { RoomPhoto } from "@/domain/room-photo";
import type { Profile } from "@/domain/profile";

type PhotoWithProfile = RoomPhoto & { profile: Profile | null };

interface PhotoLightboxProps {
  photos: PhotoWithProfile[];
  selectedIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  currentUserId?: string | null;
  onDelete?: (photoId: string) => Promise<boolean>;
  onUpdateCaption?: (photoId: string, caption: string | null) => Promise<boolean>;
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// Optimized for fullscreen viewing
const VW_FRACTION = 0.94;
const VH_FRACTION = 0.88;

function computeDisplaySize(naturalWidth: number, naturalHeight: number) {
  const naturalRatio = naturalWidth / naturalHeight;
  const maxW = window.innerWidth * VW_FRACTION;
  const maxH = window.innerHeight * VH_FRACTION;

  let w = maxW;
  let h = w / naturalRatio;

  if (h > maxH) {
    h = maxH;
    w = h * naturalRatio;
  }

  return { width: Math.round(w), height: Math.round(h) };
}

function getInitialSize() {
  if (typeof window === "undefined") return { width: 600, height: 600 };
  const size = Math.min(window.innerWidth * VW_FRACTION, window.innerHeight * VH_FRACTION);
  return { width: size, height: size };
}

const LightboxImage = memo(function LightboxImage({
  photo,
}: {
  photo: PhotoWithProfile;
}) {
  const t = useI18n();
  const [isLoaded, setIsLoaded] = useState(false);
  const [size, setSize] = useState(getInitialSize);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setSize(computeDisplaySize(img.naturalWidth, img.naturalHeight));
    setIsLoaded(true);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-lg transition-[width,height] duration-300 ease-out bg-black/20"
      style={{ width: size.width, height: size.height }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="lg" variant="light" />
        </div>
      )}
      <Image
        src={photo.photo_url}
        alt={t("roomPhotos.photoAlt")}
        fill
        className={`object-contain transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        onLoad={handleLoad}
        priority
      />
    </div>
  );
});

LightboxImage.displayName = "LightboxImage";

export function PhotoLightbox({
  photos,
  selectedIndex,
  onClose,
  onNavigate,
  currentUserId = null,
  onDelete,
  onUpdateCaption,
}: PhotoLightboxProps) {
  const t = useI18n();
  const captionInputRef = useRef<HTMLInputElement>(null);

  const isOpen = selectedIndex !== null;
  const photo = selectedIndex !== null ? photos[selectedIndex] : null;
  const isOwner =
    photo !== null && currentUserId !== null && photo.user_id === currentUserId;

  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState("");
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [prevIndex, setPrevIndex] = useState(selectedIndex);
  if (selectedIndex !== prevIndex) {
    setPrevIndex(selectedIndex);
    setIsEditingCaption(false);
    setCaptionDraft("");
    setIsSavingCaption(false);
    setIsDeleting(false);
  }

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

  const handleStartEdit = useCallback(() => {
    if (!isOwner || !photo) return;
    setCaptionDraft(photo.caption || "");
    setIsEditingCaption(true);
    setTimeout(() => captionInputRef.current?.focus(), 0);
  }, [isOwner, photo]);

  const handleSaveCaption = useCallback(async () => {
    if (!photo || !onUpdateCaption) return;

    const trimmed = captionDraft.trim() || null;
    if (trimmed === (photo.caption || null)) {
      setIsEditingCaption(false);
      return;
    }

    setIsSavingCaption(true);
    const success = await onUpdateCaption(photo.id, trimmed);
    setIsSavingCaption(false);

    if (success) {
      setIsEditingCaption(false);
    }
  }, [photo, captionDraft, onUpdateCaption]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingCaption(false);
    setCaptionDraft("");
  }, []);

  const handleCaptionKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveCaption();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleCancelEdit();
      }
    },
    [handleSaveCaption, handleCancelEdit]
  );

  const handleDelete = useCallback(async () => {
    if (!photo || !onDelete) return;
    if (!window.confirm(t("roomPhotos.deleteConfirm"))) return;

    setIsDeleting(true);
    await onDelete(photo.id);
    setIsDeleting(false);
  }, [photo, onDelete, t]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingCaption) return;

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
  }, [isOpen, onClose, handlePrev, handleNext, isEditingCaption]);

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
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-sm"
          />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-11 h-11 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={t("common.close")}
          >
            <CloseIcon />
          </button>

          {/* Photo counter */}
          <div className="absolute top-5 left-5 z-20 text-sm text-white/50 font-medium tracking-wide">
            {(selectedIndex ?? 0) + 1} <span className="text-white/30">/</span> {photos.length}
          </div>

          {/* Navigation buttons */}
          {hasPrev && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 sm:left-5 z-20 w-12 h-12 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
              aria-label={t("roomPhotos.prevPhoto")}
            >
              <ChevronLeftIcon />
            </button>
          )}

          {hasNext && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 sm:right-5 z-20 w-12 h-12 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
              aria-label={t("roomPhotos.nextPhoto")}
            >
              <ChevronRightIcon />
            </button>
          )}

          {/* Main content */}
          <m.div
            key={photo.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              if (isEditingCaption) return;
              const swipeDelta = info.offset.x;
              const swipeVelocity = info.velocity.x;

              if (swipeDelta < -80 || swipeVelocity < -500) {
                if (hasNext) handleNext();
              } else if (swipeDelta > 80 || swipeVelocity > 500) {
                if (hasPrev) handlePrev();
              }
            }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="relative flex flex-col items-center w-fit max-w-[94vw] touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo */}
            <LightboxImage key={photo.id} photo={photo} />

            {/* Info panel */}
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-2xl mt-4 px-1"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <Avatar className="w-10 h-10 rounded-full ring-2 ring-white/10">
                  <OptimizedAvatarImage
                    src={photo.profile?.avatar_url}
                    alt={photo.profile?.name || ""}
                    context="card"
                    fallback={getInitials(photo.profile?.name || "?")}
                    fallbackClassName="bg-white/10 text-white/60 text-sm font-medium"
                  />
                </Avatar>

                {/* Name and date */}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-white font-medium">
                    {photo.profile?.name || t("roomPhotos.unknownUser")}
                  </p>
                  {photo.taken_at && (
                    <p className="text-xs text-white/40 mt-0.5">
                      {formatDate(photo.taken_at)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {isOwner && onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    aria-label={t("roomPhotos.delete")}
                    className="text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
                  >
                    {isDeleting ? (
                      <Spinner size="xs" variant="light" />
                    ) : (
                      <TrashIcon />
                    )}
                  </Button>
                )}
              </div>

              {/* Caption */}
              {(photo.caption || isOwner) && (
                <div className="mt-3">
                  {isEditingCaption ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={captionInputRef}
                        type="text"
                        value={captionDraft}
                        onChange={(e) => setCaptionDraft(e.target.value)}
                        onKeyDown={handleCaptionKeyDown}
                        maxLength={ROOM_PHOTOS.maxCaptionLength}
                        placeholder={t("roomPhotos.captionPlaceholder")}
                        disabled={isSavingCaption}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 outline-none px-3 py-2 focus:border-white/20 transition-colors"
                      />
                      {isSavingCaption && (
                        <Spinner size="xs" variant="light" />
                      )}
                    </div>
                  ) : (
                    <p
                      onClick={isOwner ? handleStartEdit : undefined}
                      className={`text-sm leading-relaxed ${
                        photo.caption
                          ? "text-white/70"
                          : "text-white/30 italic"
                      } ${isOwner ? "cursor-text hover:text-white/90 transition-colors inline-flex items-center gap-1.5 group" : ""}`}
                    >
                      {photo.caption || t("roomPhotos.captionPlaceholder")}
                      {isOwner && !photo.caption && (
                        <EditIcon />
                      )}
                    </p>
                  )}
                </div>
              )}
            </m.div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
