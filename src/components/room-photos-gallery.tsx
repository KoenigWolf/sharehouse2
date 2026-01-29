"use client";

import { useState, useRef, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { uploadRoomPhoto } from "@/lib/room-photos/actions";
import { useI18n } from "@/hooks/use-i18n";
import { PhotoLightbox } from "@/components/photo-lightbox";
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
      <Button
        type="button"
        variant="ghost"
        onClick={onClick}
        className="group w-full h-auto p-0 flex-col justify-start bg-white border border-[#e5e5e5] overflow-hidden hover:border-[#1a1a1a] hover:bg-white text-left"
      >
        <div className="relative w-full aspect-square overflow-hidden">
          <Image
            src={photo.photo_url}
            alt={t("roomPhotos.photoAlt")}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/90 text-[#1a1a1a]">
              <ExpandIcon />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full p-2.5 border-t border-[#e5e5e5]">
          {photo.profile?.avatar_url ? (
            <Image
              src={photo.profile.avatar_url}
              alt={photo.profile.name}
              width={20}
              height={20}
              className="rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#f5f5f3] flex items-center justify-center flex-shrink-0">
              <span className="text-[8px] text-[#a3a3a3]">
                {photo.profile?.name?.charAt(0) || "?"}
              </span>
            </div>
          )}
          <span className="text-[11px] text-[#737373] truncate">
            {photo.profile?.name || t("roomPhotos.unknownUser")}
          </span>
        </div>
      </Button>
    </m.div>
  );
});

PhotoCard.displayName = "PhotoCard";

function UploadCard({ onUpload, isUploading }: { onUpload: (file: File) => void; isUploading: boolean }) {
  const t = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
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
        className="w-full h-auto p-0 flex-col aspect-square bg-[#fafaf8] hover:bg-[#f5f5f3] hover:border-[#a3a3a3]"
      >
        {isUploading ? (
          <Spinner />
        ) : (
          <>
            <Plus className="w-6 h-6 text-[#a3a3a3]" />
            <span className="text-[10px] text-[#a3a3a3] mt-1">
              {t("roomPhotos.uploadButton")}
            </span>
          </>
        )}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
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
      <span className="text-[#a3a3a3]">{icon}</span>
      <h2 className="text-xs text-[#a3a3a3] tracking-wide uppercase">{title}</h2>
      {count !== undefined && (
        <span className="text-[10px] text-[#a3a3a3] font-mono ml-auto">
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handlePhotoClick = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handleNavigate = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("photo", file);

    const result = await uploadRoomPhoto(formData);

    if ("error" in result) {
      setFeedback({ type: "error", message: result.error });
    } else {
      setFeedback({ type: "success", message: t("roomPhotos.uploadSuccess") });
      router.refresh();
      setTimeout(() => setFeedback(null), 3000);
    }

    setIsUploading(false);
  }, [router, t]);

  const hasPhotos = photos.length > 0;

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
          count={hasPhotos ? photos.length : undefined}
        />

        <AnimatePresence mode="wait">
          {feedback && (
            <m.div
              key={feedback.type}
              role={feedback.type === "error" ? "alert" : undefined}
              aria-live="polite"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={`mb-4 py-3 px-4 ${
                feedback.type === "error"
                  ? "bg-[#faf8f8] border-l-2 border-[#c9a0a0]"
                  : "bg-[#f8faf8] border-l-2 border-[#a0c9a0]"
              }`}
            >
              <p className={`text-sm ${
                feedback.type === "error" ? "text-[#8b6b6b]" : "text-[#6b8b6b]"
              }`}>
                {feedback.message}
              </p>
            </m.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <UploadCard onUpload={handleUpload} isUploading={isUploading} />
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              onClick={() => handlePhotoClick(index)}
            />
          ))}
        </div>

        {hasPhotos && (
          <p className="text-[10px] text-[#a3a3a3] mt-4 tracking-wide">
            {t("roomPhotos.clickToEnlarge")}
          </p>
        )}

        {!hasPhotos && (
          <p className="text-xs text-[#a3a3a3] mt-4">
            {t("roomPhotos.noPhotosHint")}
          </p>
        )}
      </m.section>

      <PhotoLightbox
        photos={photos}
        selectedIndex={selectedIndex}
        onClose={handleClose}
        onNavigate={handleNavigate}
      />
    </>
  );
}
