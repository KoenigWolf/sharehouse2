"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Camera, ImagePlus } from "lucide-react";
import dynamic from "next/dynamic";
import { useI18n } from "@/hooks/use-i18n";
import { useUser } from "@/hooks/use-user";
import { useBulkUpload } from "@/hooks/use-bulk-upload";
import { usePhotoGallery } from "@/hooks/use-photo-gallery";
import { useLightbox } from "@/hooks/use-lightbox";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { BulkUploadProgress } from "@/components/bulk-upload-progress";
import { PhotoCard } from "@/components/gallery";
import { Spinner } from "@/components/ui/spinner";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { ICON_SIZE, ICON_STROKE } from "@/lib/constants/icons";
import { FILE_UPLOAD } from "@/lib/constants/config";
import type { PhotoWithProfile } from "@/domain/room-photo";

const PhotoLightbox = dynamic(
  () => import("@/components/photo-lightbox").then((mod) => mod.PhotoLightbox),
  { ssr: false }
);

interface RoomPhotosGalleryProps {
  photos: PhotoWithProfile[];
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


interface GalleryFooterProps {
  maxBulkUpload: number;
}

const GalleryFooter = memo(function GalleryFooter({
  maxBulkUpload,
}: GalleryFooterProps) {
  const t = useI18n();

  return (
    <footer className="mt-10 pt-6 border-t border-border">
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        <span className="text-brand-500 font-semibold mr-1">
          {t("roomPhotos.infoLabel")}
        </span>
        {t("roomPhotos.bulkUploadLimit", { count: maxBulkUpload })}
        <span className="mx-1.5 text-muted-foreground/70" aria-hidden="true">·</span>
        {t("roomPhotos.supportedFormats")}
      </p>
    </footer>
  );
});

GalleryFooter.displayName = "GalleryFooter";

/**
 * Room photos gallery component
 *
 * Features:
 * - Masonry layout
 * - Infinite Scroll
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
    maxBulkUpload,
    showMore,
    actionHandlers,
    addPhotos,
  } = usePhotoGallery({
    initialPhotos,
  });

  // Infinite Scroll
  const [loadMoreRef, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
  });

  const wasIntersectingRef = useRef(false);

  useEffect(() => {
    // Only trigger on transition from false → true
    if (isIntersecting && !wasIntersectingRef.current && hasMore) {
      showMore();
    }
    wasIntersectingRef.current = isIntersecting;
  }, [isIntersecting, hasMore, showMore]);

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

  const handleSelectFiles = useCallback(
    (files: File[]) => {
      startUpload(files, (newPhotos) => {
        // Optimistic update: convert RoomPhoto[] to PhotoWithProfile[]
        const photosWithProfile: PhotoWithProfile[] = newPhotos.map((photo) => ({
          ...photo,
          profile: null,
        }));
        addPhotos(photosWithProfile);
      });
    },
    [startUpload, addPhotos]
  );

  const handlePhotoClick = useCallback(
    (index: number) => {
      lightbox.open(index);
    },
    [lightbox]
  );

  const canUpload = !!userId && !isUploading;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFabClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleSelectFiles(Array.from(files));
      }
      e.target.value = "";
    },
    [handleSelectFiles]
  );

  return (
    <>
      <m.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        aria-labelledby="gallery-title"
      >
        <SectionHeader
          icon={<Camera size={ICON_SIZE.md} strokeWidth={ICON_STROKE.thin} />}
          title={t("roomPhotos.gallery")}
          count={hasPhotos ? photos.length : undefined}
        />

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
            <m.div
              key={feedback.type}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="mb-5"
            >
              <FeedbackMessage type={feedback.type} message={feedback.message} />
            </m.div>
          )}
        </AnimatePresence>

        <div
          className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4 mx-auto"
          role="list"
          aria-label={t("roomPhotos.gallery")}
        >
          {visiblePhotos.map((photo, index) => (
            <div key={photo.id} className="break-inside-avoid mb-2 md:mb-4" role="listitem">
              <PhotoCard
                photo={photo}
                index={index}
                onClick={() => handlePhotoClick(index)}
              />
            </div>
          ))}
        </div>

        <div ref={loadMoreRef} className="h-4 w-full" />

        {hasMore && (
          <div className="flex justify-center py-8">
            <Spinner className="text-brand-500/50" />
          </div>
        )}

        <GalleryFooter maxBulkUpload={maxBulkUpload} />

        {!hasPhotos && !hasMore && (
          <p className="text-sm text-muted-foreground mt-6 text-center py-12">
            {t("roomPhotos.noPhotosHint")}
          </p>
        )}
      </m.section>

      <PhotoLightbox
        photos={photos}
        selectedIndex={lightbox.selectedIndex}
        onClose={lightbox.close}
        onNavigate={lightbox.goTo}
        currentUserId={userId}
        onDelete={actionHandlers.onDelete}
        onUpdateCaption={actionHandlers.onUpdateCaption}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_UPLOAD.inputAccept}
        multiple
        onChange={handleFileChange}
        disabled={!canUpload}
        className="hidden"
        aria-label={t("roomPhotos.uploadButton")}
      />

      {/* FAB - Floating Action Button */}
      {canUpload && (
        <FloatingActionButton
          onClick={handleFabClick}
          icon={ImagePlus}
          label={t("roomPhotos.uploadButton")}
        />
      )}
    </>
  );
}
