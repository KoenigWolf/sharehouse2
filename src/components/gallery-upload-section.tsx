"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { uploadRoomPhoto } from "@/lib/room-photos/actions";
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
        router.refresh();
        setTimeout(() => setSuccess(""), 3000);
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
          className="flex-1 h-10 px-3 bg-white border border-[#e4e4e7] text-[#18181b] text-sm placeholder:text-[#d4d4d8] focus:outline-none focus:border-[#18181b] transition-colors"
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

      <p className="text-[10px] text-[#a1a1aa]">
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
            className="py-3 px-4 bg-[#fef2f2] border-l-2 border-[#e5a0a0]"
          >
            <p className="text-sm text-[#8b4040]">{error}</p>
          </m.div>
        )}
        {success && (
          <m.div
            key="success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="py-3 px-4 bg-[#f0fdf4] border-l-2 border-[#93c5a0]"
          >
            <p className="text-sm text-[#3d6b4a]">{success}</p>
          </m.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
