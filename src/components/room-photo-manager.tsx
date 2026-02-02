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
import { ROOM_PHOTOS } from "@/lib/constants/config";
import type { RoomPhoto } from "@/domain/room-photo";

interface RoomPhotoManagerProps {
  photos: RoomPhoto[];
  maxPhotos?: number;
  compact?: boolean;
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
}: RoomPhotoManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useI18n();

  const [currentPhotos, setCurrentPhotos] = useState<RoomPhoto[]>(photos);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Sync local state when server data changes (e.g., after router.refresh from bulk upload)
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

  const canUpload = currentPhotos.length < maxPhotos;
  const maxRemaining = maxPhotos - currentPhotos.length;

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
      startUpload(Array.from(files), maxRemaining);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [startUpload, maxRemaining]
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
    <div className={compact ? "" : "bg-white border border-[#e4e4e7]"}>
      {!compact && (
        <div className="px-4 py-3 border-b border-[#e4e4e7] flex items-center justify-between">
          <p className="text-xs text-[#a1a1aa] tracking-wide">
            {t("roomPhotos.roomPhotosSection")}
          </p>
          <span className="text-[10px] text-[#a1a1aa]">
            {currentPhotos.length}/{maxPhotos} {t("roomPhotos.maxPhotos")}
          </span>
        </div>
      )}

      <div className={compact ? "space-y-4" : "p-4 space-y-4"}>
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
              className={`py-3 px-4 ${
                activeFeedback.type === "error"
                  ? "bg-[#fef2f2] border-l-2 border-[#e5a0a0]"
                  : "bg-[#f0fdf4] border-l-2 border-[#93c5a0]"
              }`}
            >
              <p
                className={`text-sm ${
                  activeFeedback.type === "error"
                    ? "text-[#8b4040]"
                    : "text-[#3d6b4a]"
                }`}
              >
                {activeFeedback.message}
              </p>
            </m.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-2">
          {currentPhotos.map((photo) => (
            <m.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative aspect-square bg-[#f4f4f5] group"
            >
              <Image
                src={photo.photo_url}
                alt={photo.caption || t("roomPhotos.photoAlt")}
                fill
                sizes="(max-width: 640px) 33vw, 20vw"
                className="object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDelete(photo.id)}
                disabled={deletingId === photo.id}
                aria-label={t("roomPhotos.delete")}
                className="absolute top-1 right-1 bg-black/60 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-black/80 hover:text-white"
              >
                {deletingId === photo.id ? (
                  <Spinner size="xs" variant="light" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
              </Button>
            </m.div>
          ))}

          {canUpload && (
            <Button
              type="button"
              variant="dashed"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="aspect-square h-auto flex-col gap-1 bg-[#fafafa] hover:bg-[#f4f4f5]"
            >
              {isUploading ? (
                <Spinner />
              ) : (
                <>
                  <Plus className="w-5 h-5 text-[#a1a1aa]" />
                  <span className="text-[9px] text-[#a1a1aa]">
                    {t("roomPhotos.upload")}
                  </span>
                </>
              )}
            </Button>
          )}
        </div>

        {canUpload && (
          <p className="text-[10px] text-[#a1a1aa]">
            {t("profile.photoFormat")} — {t("roomPhotos.selectMultiple")}
          </p>
        )}

        {currentPhotos.length === 0 && (
          <p className="text-xs text-[#a1a1aa] text-center py-4">
            {t("roomPhotos.noPhotosHint")}
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
