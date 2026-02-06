"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/use-i18n";
import { getInitials } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { useBulkUpload } from "@/hooks/use-bulk-upload";
import { BulkUploadProgress } from "@/components/bulk-upload-progress";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { deleteRoomPhoto, updateRoomPhotoCaption } from "@/lib/room-photos/actions";
import { ROOM_PHOTOS } from "@/lib/constants/config";
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

interface PhotoCardProps {
  photo: PhotoWithProfile;
  index: number;
  onClick: () => void;
}

const PhotoCard = memo(function PhotoCard({ photo, index, onClick }: PhotoCardProps) {
  const t = useI18n();

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: index * 0.015 }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onClick()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
        className="group relative w-full aspect-square overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset bg-slate-200"
      >
        <Image
          src={photo.photo_url}
          alt={t("roomPhotos.photoAlt")}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover object-center"
        />
        {/* Instagram-style hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
            <Avatar className="w-7 h-7 rounded-full ring-2 ring-white/80 shadow-lg">
              <OptimizedAvatarImage
                src={photo.profile?.avatar_url}
                alt={photo.profile?.name || ""}
                context="card"
                fallback={getInitials(photo.profile?.name || "?")}
                fallbackClassName="bg-white text-slate-600 text-[10px] font-bold"
              />
            </Avatar>
            <span className="text-[13px] text-white font-semibold drop-shadow-lg max-w-[120px] truncate">
              {photo.profile?.name || t("roomPhotos.unknownUser")}
            </span>
          </div>
        </div>
      </div>
    </m.div>
  );
});

PhotoCard.displayName = "PhotoCard";

function UploadCard({
  onSelectFiles,
  isUploading,
}: {
  onSelectFiles: (files: File[]) => void;
  isUploading: boolean;
}) {
  const t = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onSelectFiles(Array.from(files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={handleClick}
        disabled={isUploading}
        className="w-full h-auto p-0 flex-col aspect-square bg-slate-100 hover:bg-slate-200 border-0 rounded-none"
      >
        {isUploading ? (
          <Spinner />
        ) : (
          <>
            <Plus className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
            <span className="text-[11px] text-slate-400 mt-1.5 font-medium">
              {t("roomPhotos.uploadButton")}
            </span>
          </>
        )}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </m.div>
  );
}

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  count?: number;
}

const SectionHeader = memo(function SectionHeader({ icon, title, count }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="text-slate-400">{icon}</span>
      <h2 className="text-xs text-slate-900 tracking-wide uppercase font-medium">{title}</h2>
      {count !== undefined && (
        <span className="text-[11px] text-slate-400 ml-1">
          {count}
        </span>
      )}
    </div>
  );
});

SectionHeader.displayName = "SectionHeader";

export function RoomPhotosGallery({ photos }: RoomPhotosGalleryProps) {
  const t = useI18n();
  const router = useRouter();
  const { userId } = useUser();
  const INITIAL_VISIBLE = 24;
  const [localPhotos, setLocalPhotos] = useState(photos);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);

  useEffect(() => {
    if (selectedIndex === null) return;
    if (localPhotos.length === 0) {
      setSelectedIndex(null);
    } else if (selectedIndex >= localPhotos.length) {
      setSelectedIndex(localPhotos.length - 1);
    }
  }, [localPhotos.length, selectedIndex]);

  const {
    items: uploadItems,
    isUploading,
    completedCount,
    totalCount,
    feedback,
    startUpload,
  } = useBulkUpload();

  const userPhotoCount = userId
    ? localPhotos.filter((p) => p.user_id === userId).length
    : 0;
  const remainingTotal = Math.max(0, ROOM_PHOTOS.maxPhotosPerUser - userPhotoCount);
  const effectiveBulkLimit = Math.min(ROOM_PHOTOS.maxBulkUpload, remainingTotal);

  const handlePhotoClick = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handleNavigate = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleSelectFiles = useCallback(
    (files: File[]) => {
      startUpload(files, remainingTotal);
    },
    [startUpload, remainingTotal]
  );

  const handleDeletePhoto = useCallback(
    async (photoId: string): Promise<boolean> => {
      const result = await deleteRoomPhoto(photoId);
      if ("error" in result) return false;

      setLocalPhotos((prev) => prev.filter((p) => p.id !== photoId));
      router.refresh();
      return true;
    },
    [router]
  );

  const handleUpdateCaption = useCallback(
    async (photoId: string, caption: string | null): Promise<boolean> => {
      const result = await updateRoomPhotoCaption(photoId, caption);
      if ("error" in result) return false;

      setLocalPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, caption } : p))
      );
      router.refresh();
      return true;
    },
    [router]
  );

  const hasPhotos = localPhotos.length > 0;
  const visiblePhotos = localPhotos.slice(0, visibleCount);
  const hasMore = localPhotos.length > visibleCount;
  const remainingPhotos = localPhotos.length - visibleCount;

  const handleShowMore = useCallback(() => {
    setVisibleCount((prev) => prev + INITIAL_VISIBLE);
  }, []);

  return (
    <>
      <m.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        <SectionHeader
          icon={<CameraIcon />}
          title={t("roomPhotos.gallery")}
          count={hasPhotos ? localPhotos.length : undefined}
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
              role={feedback.type === "error" ? "alert" : undefined}
              aria-live="polite"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className={`mb-5 py-3 px-4 rounded-lg ${feedback.type === "error"
                ? "bg-error-bg/50 border-l-2 border-error-border"
                : "bg-success-bg/50 border-l-2 border-success-border"
                }`}
            >
              <p className={`text-sm ${feedback.type === "error" ? "text-error" : "text-success"
                }`}>
                {feedback.message}
              </p>
            </m.div>
          )}
        </AnimatePresence>

        {/* Instagram-style grid: 3 columns, minimal gap */}
        <div className="grid grid-cols-3 gap-[2px] sm:gap-1 bg-slate-200/50 rounded-sm overflow-hidden">
          {remainingTotal > 0 && (
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

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={handleShowMore}
              className="h-11 px-8 rounded-full border border-slate-200 text-sm font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
            >
              {t("roomPhotos.showMore", { count: remainingPhotos })}
            </button>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <span className="text-brand-500 font-semibold mr-1">{t("roomPhotos.infoLabel")}</span>
            {t("roomPhotos.uploadLimit", { max: ROOM_PHOTOS.maxPhotosPerUser, bulk: effectiveBulkLimit })}
            <span className="mx-1.5 text-slate-300">·</span>
            {t("roomPhotos.supportedFormats")}
          </p>
        </div>

        {!hasPhotos && (
          <p className="text-sm text-slate-400 mt-6 text-center py-12">
            {t("roomPhotos.noPhotosHint")}
          </p>
        )}
      </m.section>

      <PhotoLightbox
        photos={localPhotos}
        selectedIndex={selectedIndex}
        onClose={handleClose}
        onNavigate={handleNavigate}
        currentUserId={userId}
        onDelete={handleDeletePhoto}
        onUpdateCaption={handleUpdateCaption}
      />
    </>
  );
}
