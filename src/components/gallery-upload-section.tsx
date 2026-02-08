"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { uploadRoomPhoto } from "@/lib/room-photos/actions";
import { prepareImageForUpload } from "@/lib/utils/image-compression";
import { extractTakenAt } from "@/lib/utils/exif";
import { FILE_UPLOAD } from "@/lib/constants/config";
import { useI18n } from "@/hooks/use-i18n";

export function GalleryUploadSection() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useI18n();

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [caption, setCaption] = useState("");

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setError("");
      setSuccess("");

      try {
        // Canvas 圧縮で EXIF が消えるため、圧縮前に抽出
        const takenAt = await extractTakenAt(file);
        const prepared = await prepareImageForUpload(file);

        const formData = new FormData();
        formData.append("photo", prepared.file);
        if (caption.trim()) {
          formData.append("caption", caption.trim());
        }
        if (takenAt) {
          formData.append("takenAt", takenAt);
        }

        const result = await uploadRoomPhoto(formData);

        if ("error" in result) {
          setError(result.error);
        } else {
          setSuccess(t("roomPhotos.uploadSuccess"));
          setCaption("");
          router.refresh();
          setTimeout(() => setSuccess(""), 3000);
        }
      } catch {
        setError(t("errors.compressionFailed"));
      }

      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [caption, router, t]
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={t("roomPhotos.captionPlaceholder")}
          maxLength={200}
          className="flex-1 h-10 px-3 bg-white border border-border text-foreground text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground transition-colors"
        />
        <Button
          type="button"
          size="lg"
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <Spinner size="sm" variant="light" />
          ) : (
            t("roomPhotos.uploadButton")
          )}
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        {t("profile.photoFormat")}
      </p>

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
            className="py-3 px-4 bg-error-bg border-l-2 border-error-border"
          >
            <p className="text-sm text-error">{error}</p>
          </m.div>
        )}
        {success && (
          <m.div
            key="success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="py-3 px-4 bg-success-bg border-l-2 border-success-border"
          >
            <p className="text-sm text-success">{success}</p>
          </m.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_UPLOAD.inputAccept}
        onChange={handleFileChange}
        className="hidden"
        aria-label={t("roomPhotos.uploadButton")}
      />
    </div>
  );
}
