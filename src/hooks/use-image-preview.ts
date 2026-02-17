import { useState, useCallback, useRef, useEffect } from "react";

interface UseImagePreviewOptions {
  /** Initial image URL (e.g., existing image from database) */
  initialUrl?: string | null;
}

interface UseImagePreviewResult {
  /** Current preview URL (either blob URL or existing URL) */
  previewUrl: string | null;
  /** The selected File object */
  selectedFile: File | null;
  /** Whether an image is currently selected */
  hasImage: boolean;
  /** Whether the current image is from a new file selection (not the initial URL) */
  isNewImage: boolean;
  /** Ref to attach to the file input element */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Handle file selection from input change event */
  handleSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Remove the current image selection */
  handleRemove: () => void;
  /** Open file picker dialog */
  openPicker: () => void;
  /** Cleanup function to revoke blob URL (call when modal closes) */
  cleanup: () => void;
}

/**
 * Hook to manage image preview with proper cleanup of blob URLs.
 * Handles the lifecycle of `URL.createObjectURL` / `URL.revokeObjectURL`.
 *
 * @example
 * ```tsx
 * const { previewUrl, inputRef, handleSelect, handleRemove, openPicker, cleanup } = useImagePreview({
 *   initialUrl: existingImageUrl,
 * });
 *
 * useEffect(() => {
 *   if (!isOpen) cleanup();
 * }, [isOpen, cleanup]);
 *
 * return (
 *   <>
 *     <input ref={inputRef} type="file" onChange={handleSelect} />
 *     {previewUrl && <img src={previewUrl} alt="Preview" />}
 *   </>
 * );
 * ```
 */
export function useImagePreview(options: UseImagePreviewOptions = {}): UseImagePreviewResult {
  const { initialUrl = null } = options;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Track whether the preview is from a new file or the initial URL
  const isNewImage = selectedFile !== null;
  const hasImage = previewUrl !== null;

  // Cleanup blob URL if it's not the initial URL
  const revokeBlobUrl = useCallback((url: string | null) => {
    if (url && url !== initialUrl && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, [initialUrl]);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous blob URL if any
    revokeBlobUrl(previewUrl);

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }, [previewUrl, revokeBlobUrl]);

  const handleRemove = useCallback(() => {
    revokeBlobUrl(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);

    // Reset file input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [previewUrl, revokeBlobUrl]);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const cleanup = useCallback(() => {
    revokeBlobUrl(previewUrl);
  }, [previewUrl, revokeBlobUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl !== initialUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, initialUrl]);

  return {
    previewUrl,
    selectedFile,
    hasImage,
    isNewImage,
    inputRef,
    handleSelect,
    handleRemove,
    openPicker,
    cleanup,
  };
}
