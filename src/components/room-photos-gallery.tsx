"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/use-i18n";
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
      <div
        role="button"
        tabIndex={0}
        onClick={() => onClick()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
        className="group w-full bg-white border border-[#e4e4e7] rounded-lg overflow-hidden transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] focus-visible:ring-offset-2 hover:border-[#18181b] cursor-pointer"
      >
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: "100%" }}>
          <Image
            src={photo.photo_url}
            alt={t("roomPhotos.photoAlt")}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/90 text-[#18181b]">
              <ExpandIcon />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 border-t border-[#e4e4e7]">
          {photo.profile?.avatar_url ? (
            <Image
              src={photo.profile.avatar_url}
              alt={photo.profile.name}
              width={20}
              height={20}
              className="rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#f4f4f5] flex items-center justify-center shrink-0">
              <span className="text-[8px] text-[#a1a1aa]">
                {photo.profile?.name?.charAt(0) || "?"}
              </span>
            </div>
          )}
          <span className="text-[11px] text-[#71717a] truncate">
            {photo.profile?.name || t("roomPhotos.unknownUser")}
          </span>
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        type="button"
        variant="dashed"
        onClick={handleClick}
        disabled={isUploading}
        className="w-full h-auto p-0 flex-col aspect-square bg-[#f4f4f5] hover:bg-[#e4e4e7] hover:border-[#a1a1aa]"
      >
        {isUploading ? (
          <Spinner />
        ) : (
          <>
            <Plus className="w-6 h-6 text-[#a1a1aa]" />
            <span className="text-[10px] text-[#a1a1aa] mt-1">
              {t("roomPhotos.uploadButton")}
            </span>
            <span className="text-[9px] text-[#d4d4d8] mt-0.5">
              {t("roomPhotos.selectMultiple")}
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
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[#a1a1aa]">{icon}</span>
      <h2 className="text-xs text-[#a1a1aa] tracking-wide uppercase">{title}</h2>
      {count !== undefined && (
        <span className="text-[10px] text-[#a1a1aa] font-mono ml-auto">
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
  const [localPhotos, setLocalPhotos] = useState(photos);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);

  // 削除後に selectedIndex が範囲外になった場合の補正
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
              transition={{ duration: 0.2 }}
              className={`mb-4 py-3 px-4 ${feedback.type === "error"
                ? "bg-error-bg border-l-2 border-error-border"
                : "bg-success-bg border-l-2 border-success-border"
                }`}
            >
              <p className={`text-sm ${feedback.type === "error" ? "text-error" : "text-success"
                }`}>
                {feedback.message}
              </p>
            </m.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {remainingTotal > 0 && (
            <UploadCard
              onSelectFiles={handleSelectFiles}
              isUploading={isUploading}
            />
          )}
          {localPhotos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              onClick={() => handlePhotoClick(index)}
            />
          ))}
        </div>

        {hasPhotos && (
          <p className="text-[10px] text-[#a1a1aa] mt-4 tracking-wide">
            {t("roomPhotos.clickToEnlarge")}
          </p>
        )}

        <div className="mt-8 pt-6 border-t border-slate-50">
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
            <span className="text-brand-500 font-bold mr-1">INFO:</span>
            {t("roomPhotos.uploadLimit", { max: ROOM_PHOTOS.maxPhotosPerUser, bulk: effectiveBulkLimit })}
            <br />
            {t("roomPhotos.supportedFormats")} — {t("roomPhotos.uploadInstructions")}
          </p>
        </div>

        {!hasPhotos && (
          <p className="text-xs text-slate-400 mt-4 italic">
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
