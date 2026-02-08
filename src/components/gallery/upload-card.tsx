"use client";

import { memo, useRef, useCallback } from "react";
import { m } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/use-i18n";
import { FILE_UPLOAD } from "@/lib/constants/config";

interface UploadCardProps {
  onSelectFiles: (files: File[]) => void;
  isUploading: boolean;
  disabled?: boolean;
}

/**
 * Upload card for adding new photos to the gallery
 *
 * Features:
 * - Hidden file input for better UX
 * - Multiple file selection support
 * - HEIC/HEIF support for iOS devices
 * - Loading state during upload
 * - Accessible button with proper labels
 */
export const UploadCard = memo(function UploadCard({
  onSelectFiles,
  isUploading,
  disabled = false,
}: UploadCardProps) {
  const t = useI18n();

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onSelectFiles(Array.from(files));
      }
      // Reset input to allow selecting the same file again
      e.target.value = "";
    },
    [onSelectFiles]
  );

  const isDisabled = isUploading || disabled;

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="relative"
    >
      <Button
        type="button"
        variant="ghost"
        disabled={isDisabled}
        className="w-full h-auto p-0 flex-col aspect-square bg-secondary border-0 rounded-none disabled:opacity-50 pointer-events-none"
        aria-label={t("roomPhotos.uploadButton")}
        aria-busy={isUploading}
      >
        {isUploading ? (
          <Spinner aria-label={t("common.loading")} />
        ) : (
          <>
            <Plus
              className="w-6 h-6 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span className="text-[11px] text-muted-foreground mt-1.5 font-medium">
              {t("roomPhotos.uploadButton")}
            </span>
          </>
        )}
      </Button>

      <input
        type="file"
        accept={FILE_UPLOAD.inputAccept}
        multiple
        onChange={handleFileChange}
        disabled={isDisabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        aria-label={t("roomPhotos.uploadButton")}
        title={t("roomPhotos.uploadButton")}
      />
    </m.div>
  );
});

UploadCard.displayName = "UploadCard";
