"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getInitials } from "@/lib/utils";
import { prepareImageForUpload } from "@/lib/utils/image-compression";
import { uploadAvatar } from "@/lib/profile/actions";
import { FILE_UPLOAD } from "@/lib/constants/config";
import { ICON_SIZE, ICON_STROKE } from "@/lib/constants/icons";
import { useI18n } from "@/hooks/use-i18n";

interface AvatarSectionProps {
  avatarUrl: string | null;
  name: string;
  isUploading: boolean;
  onUploadStart: () => void;
  onUploadEnd: (url?: string, error?: string) => void;
  targetUserId?: string;
}

export function AvatarSection({
  avatarUrl,
  name,
  isUploading,
  onUploadStart,
  onUploadEnd,
  targetUserId,
}: AvatarSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useI18n();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onUploadStart();

    try {
      const prepared = await prepareImageForUpload(file);
      const formDataUpload = new FormData();
      formDataUpload.append("avatar", prepared.file);
      if (targetUserId) {
        formDataUpload.append("targetUserId", targetUserId);
      }

      const result = await uploadAvatar(formDataUpload);

      if ("error" in result) {
        onUploadEnd(undefined, result.error);
      } else if ("url" in result) {
        onUploadEnd(result.url);
      }
    } catch {
      onUploadEnd(undefined, t("errors.compressionFailed"));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="shrink-0 group">
      <div className="relative w-40 h-40 sm:w-48 sm:h-48">
        <div className="absolute inset-0 rounded-full bg-brand-100/50 animate-pulse group-hover:animate-none group-hover:scale-105 transition-transform duration-500" />
        <Button
          type="button"
          variant="ghost"
          onClick={handleAvatarClick}
          disabled={isUploading}
          className="relative w-full h-full p-1 bg-card border-2 border-border/50 rounded-full overflow-hidden shadow-md group-hover:shadow-xl group-hover:border-brand-100 transition-all duration-500"
        >
          <Avatar className="size-full rounded-full">
            <OptimizedAvatarImage
              src={avatarUrl}
              context="edit"
              alt={t("a11y.profilePhotoAlt", { name: name || "?" })}
              fallback={getInitials(name || "?")}
              fallbackClassName="bg-muted text-muted-foreground/70 text-5xl rounded-full"
            />
          </Avatar>

          <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm opacity-50 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-2">
            <Camera size={ICON_SIZE.xl} strokeWidth={ICON_STROKE.normal} className="text-white" />
            <span className="text-white text-[10px] font-bold tracking-widest uppercase">
              {isUploading ? t("profile.uploadingPhoto") : t("profile.changePhoto")}
            </span>
          </div>

          {isUploading && (
            <div className="absolute inset-0 bg-card/90 backdrop-blur-sm flex items-center justify-center">
              <Spinner size="lg" variant="dark" />
            </div>
          )}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_UPLOAD.inputAccept}
        onChange={handleAvatarChange}
        className="hidden"
        aria-label={t("profile.changePhoto")}
      />
      <p className="text-[10px] text-muted-foreground/70 font-bold tracking-widest uppercase text-center mt-4">
        {t("profile.photoFormat")}
      </p>
    </div>
  );
}
