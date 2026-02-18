"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { PhotoWithProfile, LightboxDirection } from "@/domain/room-photo";

interface UseLightboxOptions {
  photos: PhotoWithProfile[];
  onPhotoChange?: (index: number) => void;
}

interface UseLightboxReturn {
  isOpen: boolean;
  selectedIndex: number | null;
  currentPhoto: PhotoWithProfile | null;
  hasPrev: boolean;
  hasNext: boolean;
  open: (index: number) => void;
  close: () => void;
  navigate: (direction: LightboxDirection) => void;
  goTo: (index: number) => void;
}

/**
 * Compute bounded index that stays within valid photo range
 * Returns null if photos array is empty or index is null
 */
function computeSafeIndex(
  rawIndex: number | null,
  photosLength: number
): number | null {
  if (rawIndex === null) return null;
  if (photosLength === 0) return null;
  if (rawIndex >= photosLength) return photosLength - 1;
  return rawIndex;
}

/**
 * Custom hook for managing lightbox state and navigation
 *
 * Handles:
 * - Open/close state
 * - Navigation between photos
 * - Keyboard shortcuts
 * - Adjacent image preloading
 * - Body scroll lock
 */
export function useLightbox({
  photos,
  onPhotoChange,
}: UseLightboxOptions): UseLightboxReturn {
  const [rawSelectedIndex, setRawSelectedIndex] = useState<number | null>(null);
  const prevIndexRef = useRef<number | null>(null);

  // Compute safe index as derived value (avoids setState in useEffect)
  const selectedIndex = useMemo(
    () => computeSafeIndex(rawSelectedIndex, photos.length),
    [rawSelectedIndex, photos.length]
  );

  const isOpen = selectedIndex !== null;
  const currentPhoto = selectedIndex !== null ? photos[selectedIndex] ?? null : null;
  const hasPrev = selectedIndex !== null && selectedIndex > 0;
  const hasNext = selectedIndex !== null && selectedIndex < photos.length - 1;

  const open = useCallback((index: number) => {
    if (index >= 0 && index < photos.length) {
      setRawSelectedIndex(index);
    }
  }, [photos.length]);

  const close = useCallback(() => {
    setRawSelectedIndex(null);
  }, []);

  const navigate = useCallback((direction: LightboxDirection) => {
    setRawSelectedIndex((current) => {
      if (current === null) return null;

      const newIndex = direction === "prev" ? current - 1 : current + 1;

      if (newIndex >= 0 && newIndex < photos.length) {
        return newIndex;
      }
      return current;
    });
  }, [photos.length]);

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < photos.length) {
      setRawSelectedIndex(index);
    }
  }, [photos.length]);

  // Notify parent of photo changes
  useEffect(() => {
    if (selectedIndex !== null && selectedIndex !== prevIndexRef.current) {
      prevIndexRef.current = selectedIndex;
      onPhotoChange?.(selectedIndex);
    }
  }, [selectedIndex, onPhotoChange]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          close();
          break;
        case "ArrowLeft":
          navigate("prev");
          break;
        case "ArrowRight":
          navigate("next");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close, navigate]);

  // Preload adjacent images
  useEffect(() => {
    if (selectedIndex === null) return;

    const preloadIndexes = [selectedIndex - 1, selectedIndex + 1].filter(
      (i) => i >= 0 && i < photos.length
    );

    const preloadImages = preloadIndexes.map((i) => {
      const img = new window.Image();
      img.src = photos[i].photo_url;
      return img;
    });

    return () => {
      preloadImages.forEach((img) => {
        img.src = "";
      });
    };
  }, [selectedIndex, photos]);

  return {
    isOpen,
    selectedIndex,
    currentPhoto,
    hasPrev,
    hasNext,
    open,
    close,
    navigate,
    goTo,
  };
}
