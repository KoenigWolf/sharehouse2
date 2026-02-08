"use client";

import { memo, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useI18n } from "@/hooks/use-i18n";
import { useUser } from "@/hooks/use-user";
import { useBulkUpload } from "@/hooks/use-bulk-upload";
import { usePhotoGallery } from "@/hooks/use-photo-gallery";
import { useLightbox } from "@/hooks/use-lightbox";
import { BulkUploadProgress } from "@/components/bulk-upload-progress";
import { PhotoCard, UploadCard } from "@/components/gallery";
import { ROOM_PHOTOS } from "@/lib/constants/config";
import type { PhotoWithProfile } from "@/domain/room-photo";

const PhotoLightbox = dynamic(
  () => import("@/components/photo-lightbox").then((mod) => mod.PhotoLightbox),
  { ssr: false }
);

// ============================================================================
// Types
// ============================================================================

interface RoomPhotosGalleryProps {
  photos: PhotoWithProfile[];
}

// ============================================================================
// Sub-components
// ============================================================================

function CameraIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  count?: number;
}

const SectionHeader = memo(function SectionHeader({
  icon,
  title,
  count,
}: SectionHeaderProps) {
  return (
    <header className="flex items-center gap-2 mb-5">
      <span className="text-muted-foreground">{icon}</span>
      <h2 className="text-xs text-foreground tracking-wide uppercase font-medium">
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-[11px] text-muted-foreground ml-1" aria-label={`${count} photos`}>
          {count}
        </span>
      )}
    </header>
  );
});

SectionHeader.displayName = "SectionHeader";

interface FeedbackMessageProps {
  type: "success" | "error";
  message: string;
}

const FeedbackMessage = memo(function FeedbackMessage({
  type,
  message,
}: FeedbackMessageProps) {
  const isError = type === "error";

  return (
    <m.div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`mb-5 py-3 px-4 rounded-lg ${
        isError
          ? "bg-error-bg/50 border-l-2 border-error-border"
          : "bg-success-bg/50 border-l-2 border-success-border"
      }`}
    >
      <p className={`text-sm ${isError ? "text-error" : "text-success"}`}>
        {message}
      </p>
    </m.div>
  );
});

FeedbackMessage.displayName = "FeedbackMessage";

interface ShowMoreButtonProps {
  onClick: () => void;
  remainingCount: number;
}

const ShowMoreButton = memo(function ShowMoreButton({
  onClick,
  remainingCount,
}: ShowMoreButtonProps) {
  const t = useI18n();

  return (
    <div className="flex justify-center mt-8">
      <button
        type="button"
        onClick={onClick}
        className="h-11 px-8 rounded-full border border-border text-sm font-medium text-foreground/80 hover:text-foreground hover:border-border hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        aria-label={t("roomPhotos.showMore", { count: remainingCount })}
      >
        {t("roomPhotos.showMore", { count: remainingCount })}
      </button>
    </div>
  );
});

ShowMoreButton.displayName = "ShowMoreButton";

interface GalleryFooterProps {
  maxPhotos: number;
  maxBulkUpload: number;
}

const GalleryFooter = memo(function GalleryFooter({
  maxPhotos,
  maxBulkUpload,
}: GalleryFooterProps) {
  const t = useI18n();

  return (
    <footer className="mt-10 pt-6 border-t border-border">
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        <span className="text-brand-500 font-semibold mr-1">
          {t("roomPhotos.infoLabel")}
        </span>
        {t("roomPhotos.uploadLimit", { max: maxPhotos, bulk: maxBulkUpload })}
        <span className="mx-1.5 text-muted-foreground/70" aria-hidden="true">·</span>
        {t("roomPhotos.supportedFormats")}
      </p>
    </footer>
  );
});

GalleryFooter.displayName = "GalleryFooter";

// ============================================================================
// Main Component
// ============================================================================

/**
 * Room photos gallery component
 *
 * Features:
 * - Instagram-style 3-column grid layout
 * - Lazy loading for performance
 * - Lightbox for fullscreen viewing
 * - Bulk photo upload with progress
 * - Delete and caption editing
 * - Fully accessible with keyboard navigation
 */
export function RoomPhotosGallery({ photos: initialPhotos }: RoomPhotosGalleryProps) {
  const t = useI18n();
  const { userId } = useUser();

  // Gallery state management
  const {
    photos,
    visiblePhotos,
    hasPhotos,
    hasMore,
    remainingCount,
    remainingUploadSlots,
    maxBulkUpload,
    showMore,
    actionHandlers,
  } = usePhotoGallery({
    initialPhotos,
    userId,
  });

  // Lightbox state management
  const lightbox = useLightbox({ photos });

  // Upload state management
  const {
    items: uploadItems,
    isUploading,
    completedCount,
    totalCount,
    feedback,
    startUpload,
  } = useBulkUpload();

  // Handlers
  const handleSelectFiles = useCallback(
    (files: File[]) => {
      startUpload(files, remainingUploadSlots);
    },
    [startUpload, remainingUploadSlots]
  );

  const handlePhotoClick = useCallback(
    (index: number) => {
      lightbox.open(index);
    },
    [lightbox]
  );

  const canUpload = remainingUploadSlots > 0;

  return (
    <>
      <m.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        aria-labelledby="gallery-title"
      >
        <SectionHeader
          icon={<CameraIcon />}
          title={t("roomPhotos.gallery")}
          count={hasPhotos ? photos.length : undefined}
        />

        {/* Upload progress and feedback */}
        <AnimatePresence mode="wait">
          {isUploading && (
            <BulkUploadProgress
              key="progress"
              items={uploadItems}
              completedCount={completedCount}
              totalCount={totalCount}
            />
          )}
          {!isUploading && feedback && (
            <FeedbackMessage
              key={feedback.type}
              type={feedback.type}
              message={feedback.message}
            />
          )}
        </AnimatePresence>

        {/* Photo grid */}
        <div
          className="grid grid-cols-3 gap-[2px] sm:gap-1 bg-secondary/50 rounded-sm overflow-hidden"
          role="list"
          aria-label={t("roomPhotos.gallery")}
        >
          {canUpload && (
            <UploadCard
              onSelectFiles={handleSelectFiles}
              isUploading={isUploading}
            />
          )}
          {visiblePhotos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              onClick={() => handlePhotoClick(index)}
            />
          ))}
        </div>

        {/* Show more button */}
        {hasMore && (
          <ShowMoreButton onClick={showMore} remainingCount={remainingCount} />
        )}

        {/* Footer with upload info */}
        <GalleryFooter
          maxPhotos={ROOM_PHOTOS.maxPhotosPerUser}
          maxBulkUpload={maxBulkUpload}
        />

        {/* Empty state */}
        {!hasPhotos && (
          <p className="text-sm text-muted-foreground mt-6 text-center py-12">
            {t("roomPhotos.noPhotosHint")}
          </p>
        )}
      </m.section>

      {/* Lightbox */}
      <PhotoLightbox
        photos={photos}
        selectedIndex={lightbox.selectedIndex}
        onClose={lightbox.close}
        onNavigate={lightbox.goTo}
        currentUserId={userId}
        onDelete={actionHandlers.onDelete}
        onUpdateCaption={actionHandlers.onUpdateCaption}
      />
    </>
  );
}
