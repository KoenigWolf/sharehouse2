"use client";

import { useEffect, useCallback, useState, useRef, memo } from "react";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/use-i18n";
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

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

// Instagram-style aspect ratio clamping
const MIN_RATIO = 4 / 5; // 0.8 — tallest portrait
const MAX_RATIO = 16 / 9; // 1.778 — widest landscape
const MAX_CONTAINER_W = 600;
const VW_FRACTION = 0.9;
const VH_FRACTION = 0.65;

function computeDisplaySize(naturalWidth: number, naturalHeight: number) {
  const naturalRatio = naturalWidth / naturalHeight;
  const clampedRatio = Math.max(MIN_RATIO, Math.min(MAX_RATIO, naturalRatio));

  const maxW = Math.min(window.innerWidth * VW_FRACTION, MAX_CONTAINER_W);
  const maxH = window.innerHeight * VH_FRACTION;

  let w = maxW;
  let h = w / clampedRatio;

  if (h > maxH) {
    h = maxH;
    w = h * clampedRatio;
  }

  return { width: Math.round(w), height: Math.round(h) };
}

function getInitialSize() {
  if (typeof window === "undefined") return { width: 400, height: 400 };
  const maxW = Math.min(window.innerWidth * VW_FRACTION, MAX_CONTAINER_W);
  const maxH = window.innerHeight * VH_FRACTION;
  const size = Math.min(maxW, maxH);
  return { width: size, height: size };
}

// key={photo.id} でマウントし直すことで state を自然にリセット
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
      className="relative overflow-hidden transition-[width,height] duration-200 ease-out"
      style={{ width: size.width, height: size.height }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="lg" variant="light" className="border-2" />
        </div>
      )}
      <Image
        src={photo.photo_url}
        alt={t("roomPhotos.photoAlt")}
        fill
        className={`object-cover transition-opacity duration-200 ${isLoaded ? "opacity-100" : "opacity-0"
          }`}
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

  // 写真切り替え時に編集状態をリセット（React推奨パターン: render中の条件付きsetState）
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
      // キャプション編集中はライトボックスのキーボード操作を抑止
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
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={(_, info) => {
              const swipeDelta = info.offset.x;
              const swipeVelocity = info.velocity.x;

              if (swipeDelta < -50 || swipeVelocity < -500) {
                if (hasNext) handleNext();
              } else if (swipeDelta > 50 || swipeVelocity > 500) {
                if (hasPrev) handlePrev();
              }
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative flex flex-col w-fit touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <LightboxImage key={photo.id} photo={photo} />

            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="mt-3 px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10"
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
                      {photo.profile?.name?.[0] ?? "?"}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/90">
                    {photo.profile?.name || t("roomPhotos.unknownUser")}
                  </p>
                </div>

                {isOwner && onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    aria-label={t("roomPhotos.delete")}
                    className="text-white/40 hover:text-white/80 hover:bg-white/10 shrink-0"
                  >
                    {isDeleting ? (
                      <Spinner size="xs" variant="light" />
                    ) : (
                      <TrashIcon />
                    )}
                  </Button>
                )}
              </div>

              {(photo.caption || isOwner) && (
                <div className="mt-2">
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
                        className="flex-1 bg-transparent border-b border-white/30 text-sm text-white/80 placeholder:text-white/30 outline-none py-1 focus:border-white/60 transition-colors"
                      />
                      {isSavingCaption && (
                        <Spinner size="xs" variant="light" />
                      )}
                    </div>
                  ) : (
                    <p
                      onClick={isOwner ? handleStartEdit : undefined}
                      className={`text-sm ${photo.caption
                          ? "text-white/60"
                          : "text-white/30 italic"
                        } ${isOwner ? "cursor-text hover:text-white/80 transition-colors" : ""}`}
                    >
                      {photo.caption || t("roomPhotos.captionPlaceholder")}
                    </p>
                  )}
                </div>
              )}

              {photo.taken_at && (
                <p className="mt-1.5 text-xs text-white/40">
                  {formatDate(photo.taken_at)}
                </p>
              )}
            </m.div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
