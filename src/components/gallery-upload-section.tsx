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
          className="flex-1 h-10 px-3 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
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

      <p className="text-[10px] text-[#a3a3a3]">
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
