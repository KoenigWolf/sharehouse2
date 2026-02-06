"use client";

import { useCallback, useState, useRef, memo, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/use-i18n";
import { getInitials } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatting";
import { ROOM_PHOTOS } from "@/lib/constants/config";
import type { PhotoWithProfile, PhotoActionHandlers } from "@/domain/room-photo";

// ============================================================================
// Types
// ============================================================================

interface PhotoLightboxProps extends PhotoActionHandlers {
  photos: PhotoWithProfile[];
  selectedIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  currentUserId?: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const VW_FRACTION = 0.94;
const VH_FRACTION = 0.88;
const SWIPE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 500;

// ============================================================================
// Icon Components
// ============================================================================

const CloseIcon = memo(function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
});

const ChevronLeftIcon = memo(function ChevronLeftIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
});

const ChevronRightIcon = memo(function ChevronRightIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
});

const TrashIcon = memo(function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
});

const EditIcon = memo(function EditIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
});

// ============================================================================
// Utility Functions
// ============================================================================

function computeDisplaySize(naturalWidth: number, naturalHeight: number) {
  const maxW = window.innerWidth * VW_FRACTION;
  const maxH = window.innerHeight * VH_FRACTION;

  if (naturalHeight <= 0 || naturalWidth <= 0) {
    return { width: Math.round(maxW), height: Math.round(maxH) };
  }

  const naturalRatio = naturalWidth / naturalHeight;
  let w = maxW;
  let h = w / naturalRatio;

  if (h > maxH) {
    h = maxH;
    w = h * naturalRatio;
  }

  return { width: Math.round(w), height: Math.round(h) };
}

function getInitialSize() {
  if (typeof window === "undefined") {
    return { width: 600, height: 600 };
  }
  const size = Math.min(
    window.innerWidth * VW_FRACTION,
    window.innerHeight * VH_FRACTION
  );
  return { width: size, height: size };
}

// ============================================================================
// Sub-components
// ============================================================================

interface LightboxImageProps {
  photo: PhotoWithProfile;
}

const LightboxImage = memo(function LightboxImage({ photo }: LightboxImageProps) {
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
          <Spinner size="lg" variant="light" aria-label={t("common.loading")} />
        </div>
      )}
      <Image
        src={photo.photo_url}
        alt={t("roomPhotos.photoAlt")}
        fill
        className={`object-contain transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={handleLoad}
        priority
      />
    </div>
  );
});

LightboxImage.displayName = "LightboxImage";

interface NavigationButtonProps {
  direction: "prev" | "next";
  onClick: () => void;
  label: string;
}

const NavigationButton = memo(function NavigationButton({
  direction,
  onClick,
  label,
}: NavigationButtonProps) {
  const isPrev = direction === "prev";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute ${
        isPrev ? "left-3 sm:left-5" : "right-3 sm:right-5"
      } z-20 w-12 h-12 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50`}
      aria-label={label}
    >
      {isPrev ? <ChevronLeftIcon /> : <ChevronRightIcon />}
    </button>
  );
});

NavigationButton.displayName = "NavigationButton";

interface PhotoInfoPanelProps {
  photo: PhotoWithProfile;
  isOwner: boolean;
  isDeleting: boolean;
  isEditingCaption: boolean;
  captionDraft: string;
  isSavingCaption: boolean;
  actionError: string | null;
  onDelete: () => void;
  onStartEdit: () => void;
  onCaptionChange: (value: string) => void;
  onCaptionKeyDown: (e: React.KeyboardEvent) => void;
  captionInputRef: React.RefObject<HTMLInputElement | null>;
}

const PhotoInfoPanel = memo(function PhotoInfoPanel({
  photo,
  isOwner,
  isDeleting,
  isEditingCaption,
  captionDraft,
  isSavingCaption,
  actionError,
  onDelete,
  onStartEdit,
  onCaptionChange,
  onCaptionKeyDown,
  captionInputRef,
}: PhotoInfoPanelProps) {
  const t = useI18n();
  const userName = photo.profile?.name ?? t("roomPhotos.unknownUser");

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
      className="w-full max-w-2xl mt-4 px-1"
    >
      {/* Error feedback */}
      <AnimatePresence>
        {actionError && (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            role="alert"
            className="mb-3 py-2 px-3 rounded-lg bg-red-500/20 border-l-2 border-red-500"
          >
            <p className="text-sm text-red-300">{actionError}</p>
          </m.div>
        )}
      </AnimatePresence>
      {/* User info row */}
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 rounded-full ring-2 ring-white/10">
          <OptimizedAvatarImage
            src={photo.profile?.avatar_url}
            alt=""
            context="card"
            fallback={getInitials(photo.profile?.name ?? "?")}
            fallbackClassName="bg-white/10 text-white/60 text-sm font-medium"
          />
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] text-white font-medium">{userName}</p>
          {photo.taken_at && (
            <time className="text-xs text-white/40 mt-0.5 block">
              {formatDate(photo.taken_at)}
            </time>
          )}
        </div>

        {isOwner && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
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

      {/* Caption section */}
      {(photo.caption || isOwner) && (
        <div className="mt-3">
          {isEditingCaption ? (
            <div className="flex items-center gap-2">
              <input
                ref={captionInputRef}
                type="text"
                value={captionDraft}
                onChange={(e) => onCaptionChange(e.target.value)}
                onKeyDown={onCaptionKeyDown}
                maxLength={ROOM_PHOTOS.maxCaptionLength}
                placeholder={t("roomPhotos.captionPlaceholder")}
                disabled={isSavingCaption}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 outline-none px-3 py-2 focus:border-white/20 transition-colors"
                aria-label={t("roomPhotos.caption")}
              />
              {isSavingCaption && <Spinner size="xs" variant="light" />}
            </div>
          ) : (
            <p
              onClick={isOwner ? onStartEdit : undefined}
              onKeyDown={isOwner ? (e) => e.key === "Enter" && onStartEdit() : undefined}
              tabIndex={isOwner ? 0 : undefined}
              role={isOwner ? "button" : undefined}
              className={`text-sm leading-relaxed ${
                photo.caption ? "text-white/70" : "text-white/30 italic"
              } ${
                isOwner
                  ? "cursor-text hover:text-white/90 transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
                  : ""
              }`}
            >
              {photo.caption || t("roomPhotos.captionPlaceholder")}
              {isOwner && !photo.caption && <EditIcon />}
            </p>
          )}
        </div>
      )}
    </m.div>
  );
});

PhotoInfoPanel.displayName = "PhotoInfoPanel";

// ============================================================================
// Main Component
// ============================================================================

/**
 * Photo lightbox component for fullscreen photo viewing
 *
 * Features:
 * - Fullscreen photo display with proper aspect ratio
 * - Keyboard navigation (Arrow keys, Escape)
 * - Swipe gestures for mobile
 * - Caption editing for photo owners
 * - Photo deletion for owners
 * - Adjacent image preloading
 * - Accessible with proper ARIA attributes
 */
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
  const photo = selectedIndex !== null ? photos[selectedIndex] ?? null : null;
  const isOwner = photo !== null && currentUserId !== null && photo.user_id === currentUserId;

  // Caption editing state
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState("");
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Reset state on photo change
  const [prevIndex, setPrevIndex] = useState(selectedIndex);
  if (selectedIndex !== prevIndex) {
    setPrevIndex(selectedIndex);
    setIsEditingCaption(false);
    setCaptionDraft("");
    setIsSavingCaption(false);
    setIsDeleting(false);
    setActionError(null);
  }

  const hasPrev = selectedIndex !== null && selectedIndex > 0;
  const hasNext = selectedIndex !== null && selectedIndex < photos.length - 1;

  // Navigation handlers
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

  // Caption handlers
  const handleStartEdit = useCallback(() => {
    if (!isOwner || !photo) return;
    setCaptionDraft(photo.caption ?? "");
    setIsEditingCaption(true);
    setTimeout(() => captionInputRef.current?.focus(), 0);
  }, [isOwner, photo]);

  const handleSaveCaption = useCallback(async () => {
    if (!photo || !onUpdateCaption) return;

    const trimmed = captionDraft.trim() || null;
    if (trimmed === (photo.caption ?? null)) {
      setIsEditingCaption(false);
      return;
    }

    setIsSavingCaption(true);
    setActionError(null);
    const success = await onUpdateCaption(photo.id, trimmed);
    setIsSavingCaption(false);

    if (success) {
      setIsEditingCaption(false);
    } else {
      setActionError(t("roomPhotos.captionUpdateFailed"));
    }
  }, [photo, captionDraft, onUpdateCaption, t]);

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

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!photo || !onDelete) return;
    if (!window.confirm(t("roomPhotos.deleteConfirm"))) return;

    setIsDeleting(true);
    setActionError(null);
    const success = await onDelete(photo.id);
    setIsDeleting(false);

    if (!success) {
      setActionError(t("roomPhotos.deleteFailed"));
    }
  }, [photo, onDelete, t]);

  // Keyboard navigation (handled by useLightbox hook in parent, but we still need caption editing support)
  useEffect(() => {
    if (!isOpen || isEditingCaption) return;

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
  }, [isOpen, isEditingCaption, onClose, handlePrev, handleNext]);

  // Body scroll lock
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

  // Swipe handler
  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (isEditingCaption) return;

      const { x: swipeDelta } = info.offset;
      const { x: swipeVelocity } = info.velocity;

      if (swipeDelta < -SWIPE_THRESHOLD || swipeVelocity < -SWIPE_VELOCITY_THRESHOLD) {
        if (hasNext) handleNext();
      } else if (swipeDelta > SWIPE_THRESHOLD || swipeVelocity > SWIPE_VELOCITY_THRESHOLD) {
        if (hasPrev) handlePrev();
      }
    },
    [isEditingCaption, hasNext, hasPrev, handleNext, handlePrev]
  );

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
          role="dialog"
          aria-modal="true"
          aria-label={t("roomPhotos.photoAlt")}
        >
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-11 h-11 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label={t("common.close")}
          >
            <CloseIcon />
          </button>

          {/* Photo counter */}
          <div
            className="absolute top-5 left-5 z-20 text-sm text-white/50 font-medium tracking-wide"
            aria-live="polite"
          >
            {(selectedIndex ?? 0) + 1}
            <span className="text-white/30" aria-hidden="true"> / </span>
            {photos.length}
          </div>

          {/* Navigation buttons */}
          {hasPrev && (
            <NavigationButton
              direction="prev"
              onClick={handlePrev}
              label={t("roomPhotos.prevPhoto")}
            />
          )}
          {hasNext && (
            <NavigationButton
              direction="next"
              onClick={handleNext}
              label={t("roomPhotos.nextPhoto")}
            />
          )}

          {/* Main content */}
          <m.div
            key={photo.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="relative flex flex-col items-center w-fit max-w-[94vw] touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <LightboxImage key={photo.id} photo={photo} />

            <PhotoInfoPanel
              photo={photo}
              isOwner={isOwner}
              isDeleting={isDeleting}
              isEditingCaption={isEditingCaption}
              captionDraft={captionDraft}
              isSavingCaption={isSavingCaption}
              actionError={actionError}
              onDelete={handleDelete}
              onStartEdit={handleStartEdit}
              onCaptionChange={setCaptionDraft}
              onCaptionKeyDown={handleCaptionKeyDown}
              captionInputRef={captionInputRef}
            />
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
