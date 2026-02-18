import { useState, useCallback, useRef } from "react";

interface UseImagePreviewOptions {
  initialUrl?: string | null;
}

interface UseImagePreviewReturn {
  imageFile: File | null;
  imagePreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: () => void;
  clearPreview: () => void;
  isNewImage: boolean;
}

export function useImagePreview(options: UseImagePreviewOptions = {}): UseImagePreviewReturn {
  const { initialUrl = null } = options;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialUrl);
  const [existingUrl] = useState<string | null>(initialUrl);

  const isNewImage = imagePreview !== null && imagePreview !== existingUrl;

  const revokeIfNew = useCallback(
    (url: string | null) => {
      if (url && url !== existingUrl) {
        URL.revokeObjectURL(url);
      }
    },
    [existingUrl],
  );

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      revokeIfNew(imagePreview);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    },
    [imagePreview, revokeIfNew],
  );

  const handleRemoveImage = useCallback(() => {
    revokeIfNew(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [imagePreview, revokeIfNew]);

  const clearPreview = useCallback(() => {
    revokeIfNew(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  }, [imagePreview, revokeIfNew]);

  return {
    imageFile,
    imagePreview,
    fileInputRef,
    handleImageSelect,
    handleRemoveImage,
    clearPreview,
    isNewImage,
  };
}
