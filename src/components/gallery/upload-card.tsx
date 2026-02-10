"use client";

import { memo, useCallback } from "react";
import { m } from "framer-motion";
import { Plus } from "lucide-react";
import { ICON_STROKE } from "@/lib/constants/icons";
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full aspect-[4/3] group"
    >
      <Button
        type="button"
        variant="ghost"
        disabled={isDisabled}
        className="w-full h-full flex flex-col items-center justify-center gap-3 bg-secondary/30 hover:bg-secondary/60 border-2 border-dashed border-muted-foreground/20 hover:border-brand-500/50 rounded-xl transition-all duration-300 disabled:opacity-50"
        aria-label={t("roomPhotos.uploadButton")}
        aria-busy={isUploading}
      >
        {isUploading ? (
          <Spinner className="w-8 h-8 text-brand-500" />
        ) : (
          <>
            <div className="p-3 rounded-full bg-background shadow-sm ring-1 ring-border group-hover:scale-110 group-hover:ring-brand-500/20 transition-all duration-300">
              <Plus
                className="w-6 h-6 text-muted-foreground group-hover:text-brand-500 transition-colors"
                strokeWidth={ICON_STROKE.normal}
                aria-hidden="true"
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
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
