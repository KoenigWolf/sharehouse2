"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { deleteRoomPhoto } from "@/lib/room-photos/actions";
import { useI18n } from "@/hooks/use-i18n";
import { useBulkUpload } from "@/hooks/use-bulk-upload";
import { BulkUploadProgress } from "@/components/bulk-upload-progress";
import { ROOM_PHOTOS, FILE_UPLOAD } from "@/lib/constants/config";
import type { RoomPhoto } from "@/domain/room-photo";

interface RoomPhotoManagerProps {
  photos: RoomPhoto[];
  maxPhotos?: number;
  compact?: boolean;
  previewLimit?: number;
}

/**
 * 部屋写真管理コンポーネント
 *
 * 設定ページに組み込み、ユーザーが自分の部屋写真をアップロード・削除できるUIを提供。
 * 複数枚の一括アップロードに対応。クライアント側で圧縮→直接Storageアップロード。
 *
 * @param props.photos - 現在の写真一覧
 * @param props.maxPhotos - 最大アップロード枚数（デフォルト: config値）
 */
export function RoomPhotoManager({
  photos,
  maxPhotos = ROOM_PHOTOS.maxPhotosPerUser,
  compact = false,
  previewLimit,
}: RoomPhotoManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useI18n();

  const [currentPhotos, setCurrentPhotos] = useState<RoomPhoto[]>(photos);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setCurrentPhotos(photos);
  }, [photos]);

  const {
    items: uploadItems,
    isUploading,
    completedCount,
    totalCount,
    feedback: uploadFeedback,
    startUpload,
  } = useBulkUpload();


  const remainingTotal = Math.max(0, maxPhotos - currentPhotos.length);
  const effectiveBulkLimit = Math.min(ROOM_PHOTOS.maxBulkUpload, remainingTotal);
  const canUpload = !isUploading && remainingTotal > 0;
  const hasPreviewLimit = compact && previewLimit !== undefined && currentPhotos.length > previewLimit;

  const handleUploadClick = () => {
    if (canUpload) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setError("");
      startUpload(Array.from(files), remainingTotal);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [startUpload, remainingTotal]
  );

  const handleDelete = useCallback(
    async (photoId: string) => {
      if (!window.confirm(t("roomPhotos.deleteConfirm"))) {
        return;
      }

      setDeletingId(photoId);
      setError("");

      const result = await deleteRoomPhoto(photoId);

      if ("error" in result) {
        setError(result.error);
      } else {
        setCurrentPhotos((prev) => prev.filter((p) => p.id !== photoId));
      }

      setDeletingId(null);
    },
    [t]
  );


  const activeFeedback = uploadFeedback || (error ? { type: "error" as const, message: error } : null);

  return (
    <div className={compact ? "" : "premium-surface rounded-[2rem] overflow-hidden"}>
      {!compact && (
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
          <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-brand-500
" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            {t("roomPhotos.roomPhotosSection")}
          </p>
          <span className="text-[10px] text-brand-500 font-bold tracking-wider bg-brand-50 px-2.5 py-1 rounded-full">
            {currentPhotos.length} / {maxPhotos}
          </span>
        </div>
      )}

      <div className={compact ? "space-y-6" : "p-6 space-y-6"}>
        <AnimatePresence mode="wait">
          {isUploading && (
            <BulkUploadProgress
              key="progress"
              items={uploadItems}
              completedCount={completedCount}
              totalCount={totalCount}
            />
          )}
          {!isUploading && activeFeedback && (
            <m.div
              key={activeFeedback.type}
              role={activeFeedback.type === "error" ? "alert" : undefined}
              aria-live="polite"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={`py-3 px-4 rounded-2xl border-l-4 ${activeFeedback.type === "error"
                ? "bg-error-bg/50 border-error-border text-error"
                : "bg-success-bg/50 border-success-border text-success"
                }`}
            >
              <p className="text-xs font-medium">{activeFeedback.message}</p>
            </m.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-4">
          {(hasPreviewLimit && !isExpanded ? currentPhotos.slice(0, previewLimit) : currentPhotos).map((photo) => (
            <m.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-square bg-muted rounded-2xl overflow-hidden ring-1 ring-border group shadow-sm"
            >
              <Image
                src={photo.photo_url}
                alt={photo.caption || t("roomPhotos.photoAlt")}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDelete(photo.id)}
                disabled={deletingId === photo.id}
                aria-label={t("roomPhotos.delete")}
                className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-error-bg hover:text-error shadow-sm transition-all duration-300 rounded-lg scale-90 group-hover:scale-100"
              >
                {deletingId === photo.id ? (
                  <Spinner size="xs" variant="dark" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
              </Button>
            </m.div>
          ))}

          {canUpload && (
            <m.button
              type="button"
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUploadClick}
              disabled={isUploading}
              className="aspect-square rounded-2xl border-2 border-dashed border-border bg-muted/50 hover:bg-white hover:border-brand-200 hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-2 group"
            >
              {isUploading ? (
                <Spinner variant="dark" />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center group-hover:bg-brand-100
 transition-colors">
                    <Plus className="w-5 h-5 text-brand-500" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase group-hover:text-brand-500 transition-colors">
                    {t("roomPhotos.upload")}
                  </span>
                </>
              )}
            </m.button>
          )}
        </div>

        {hasPreviewLimit && !isExpanded && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="h-9 px-6 rounded-full border border-border text-[11px] font-bold text-muted-foreground hover:text-foreground/90 hover:border-border tracking-wider uppercase transition-all duration-300"
            >
              {t("roomPhotos.showMore", { count: currentPhotos.length - (previewLimit ?? 0) })}
            </button>
          </div>
        )}

        {canUpload ? (
          <div className="pt-2">
            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
              <span className="text-brand-500 font-bold mr-1">INFO:</span>
              {t("roomPhotos.uploadLimit", { max: maxPhotos, bulk: effectiveBulkLimit })}
              <br />
              {t("roomPhotos.supportedFormats")} — {t("roomPhotos.uploadInstructions")}
            </p>
          </div>
        ) : (
          <p className="text-[10px] text-amber-500 font-bold tracking-wider uppercase bg-amber-50 px-3 py-1.5 rounded-full inline-block">
            {t("errors.maxPhotosReached")}
          </p>
        )}

        {currentPhotos.length === 0 && !isUploading && (
          <div className="py-8 text-center bg-muted/30 rounded-2xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground italic">
              {t("roomPhotos.noPhotosHint")}
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={FILE_UPLOAD.inputAccept}
          multiple
          onChange={handleFileChange}
          className="hidden"
          aria-label={t("roomPhotos.upload")}
        />
      </div>
    </div>
  );
}
