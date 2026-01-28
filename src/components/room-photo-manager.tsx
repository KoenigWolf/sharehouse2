"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { uploadRoomPhoto, deleteRoomPhoto } from "@/lib/room-photos/actions";
import { useI18n } from "@/hooks/use-i18n";
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
 * 最大5枚までの写真をグリッド表示し、各写真には削除ボタンを配置。
 * アップロードはFormData経由のサーバーアクションで処理する。
 *
 * @param props.photos - 現在の写真一覧
 * @param props.maxPhotos - 最大アップロード枚数（デフォルト: 5）
 */
export function RoomPhotoManager({ photos, maxPhotos = 5, compact = false }: RoomPhotoManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useI18n();

  const [currentPhotos, setCurrentPhotos] = useState<RoomPhoto[]>(photos);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [caption, setCaption] = useState("");

  const canUpload = currentPhotos.length < maxPhotos;

  const handleUploadClick = () => {
    if (canUpload) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("photo", file);
    if (caption.trim()) {
      formData.append("caption", caption.trim());
    }

    const result = await uploadRoomPhoto(formData);

    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(t("roomPhotos.uploadSuccess"));
      setCaption("");
      // Optimistic update - add the new photo to the list
      const newPhoto: RoomPhoto = {
        id: `temp-${Date.now()}`,
        user_id: "",
        photo_url: result.url,
        caption: caption.trim() || null,
        display_order: currentPhotos.length,
        created_at: new Date().toISOString(),
      };
      setCurrentPhotos((prev) => [...prev, newPhoto]);
      setTimeout(() => setSuccess(""), 3000);
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [caption, currentPhotos.length, t]);

  const handleDelete = useCallback(async (photoId: string) => {
    if (!window.confirm(t("roomPhotos.deleteConfirm"))) {
      return;
    }

    setDeletingId(photoId);
    setError("");
    setSuccess("");

    const result = await deleteRoomPhoto(photoId);

    if ("error" in result) {
      setError(result.error);
    } else {
      setCurrentPhotos((prev) => prev.filter((p) => p.id !== photoId));
    }

    setDeletingId(null);
  }, [t]);

  return (
    <div className={compact ? "" : "bg-white border border-[#e5e5e5]"}>
      {!compact && (
        <div className="px-4 py-3 border-b border-[#e5e5e5] flex items-center justify-between">
          <p className="text-xs text-[#a3a3a3] tracking-wide">
            {t("roomPhotos.roomPhotosSection")}
          </p>
          <span className="text-[10px] text-[#a3a3a3]">
            {currentPhotos.length}/{maxPhotos} {t("roomPhotos.maxPhotos")}
          </span>
        </div>
      )}

      <div className={compact ? "space-y-4" : "p-4 space-y-4"}>
        {/* メッセージ */}
        <AnimatePresence mode="wait">
          {error && (
            <m.div
              key="error"
              role="alert"
              aria-live="polite"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="py-3 px-4 bg-[#faf8f8] border-l-2 border-[#c9a0a0]"
            >
              <p className="text-sm text-[#8b6b6b]">{error}</p>
            </m.div>
          )}
          {success && (
            <m.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="py-3 px-4 bg-[#f8faf8] border-l-2 border-[#a0c9a0]"
            >
              <p className="text-sm text-[#6b8b6b]">{success}</p>
            </m.div>
          )}
        </AnimatePresence>

        {/* 写真グリッド */}
        <div className="grid grid-cols-3 gap-2">
          {currentPhotos.map((photo) => (
            <m.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative aspect-square bg-[#f5f5f3] group"
            >
              <Image
                src={photo.photo_url}
                alt={photo.caption || t("roomPhotos.photoAlt")}
                fill
                sizes="(max-width: 640px) 33vw, 20vw"
                className="object-cover"
              />
              {/* 削除ボタン */}
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                disabled={deletingId === photo.id}
                aria-label={t("roomPhotos.delete")}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-50"
              >
                {deletingId === photo.id ? (
                  <m.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-3 h-3 border border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
              </button>
              {/* キャプション */}
              {photo.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-black/50 px-1.5 py-1">
                  <p className="text-[9px] text-white truncate">{photo.caption}</p>
                </div>
              )}
            </m.div>
          ))}

          {/* アップロードボタン */}
          {canUpload && (
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="aspect-square border border-dashed border-[#d4d4d4] bg-[#fafaf8] flex flex-col items-center justify-center gap-1 hover:border-[#a3a3a3] hover:bg-[#f5f5f3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <m.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-5 h-5 border border-[#d4d4d4] border-t-[#1a1a1a] rounded-full"
                />
              ) : (
                <>
                  <Plus className="w-5 h-5 text-[#a3a3a3]" />
                  <span className="text-[9px] text-[#a3a3a3]">{t("roomPhotos.upload")}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* キャプション入力 */}
        {canUpload && (
          <div className="space-y-2">
            <label htmlFor="photo-caption" className="block text-xs text-[#737373] tracking-wide">
              {t("roomPhotos.caption")}
            </label>
            <input
              id="photo-caption"
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t("roomPhotos.captionPlaceholder")}
              maxLength={200}
              className="w-full h-10 px-3 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
            />
            <p className="text-[10px] text-[#a3a3a3]">
              {t("profile.photoFormat")}
            </p>
          </div>
        )}

        {/* ヒント */}
        {currentPhotos.length === 0 && (
          <p className="text-xs text-[#a3a3a3] text-center py-4">
            {t("roomPhotos.noPhotosHint")}
          </p>
        )}

        {/* 隠しファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
