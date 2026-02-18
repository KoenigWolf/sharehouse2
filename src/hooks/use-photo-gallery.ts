"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { deleteRoomPhoto, updateRoomPhotoCaption } from "@/lib/room-photos/actions";
import { ROOM_PHOTOS } from "@/lib/constants/config";
import type { PhotoWithProfile, PhotoActionHandlers } from "@/domain/room-photo";

interface UsePhotoGalleryOptions {
  initialPhotos: PhotoWithProfile[];
  initialVisibleCount?: number;
}

interface UsePhotoGalleryReturn {
  photos: PhotoWithProfile[];
  visiblePhotos: PhotoWithProfile[];
  hasPhotos: boolean;
  hasMore: boolean;
  remainingCount: number;
  maxBulkUpload: number;
  showMore: () => void;
  actionHandlers: PhotoActionHandlers;
  addPhotos: (newPhotos: PhotoWithProfile[]) => void;
}

const DEFAULT_VISIBLE_COUNT = 24;

/**
 * Custom hook for managing photo gallery state and actions
 *
 * Handles:
 * - Photo list state management
 * - Pagination (show more)
 * - Upload slot calculation
 * - Delete and caption update actions
 */
export function usePhotoGallery({
  initialPhotos,
  initialVisibleCount = DEFAULT_VISIBLE_COUNT,
}: UsePhotoGalleryOptions): UsePhotoGalleryReturn {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoWithProfile[]>(initialPhotos);
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const hasPhotos = photos.length > 0;
  const visiblePhotos = useMemo(
    () => photos.slice(0, visibleCount),
    [photos, visibleCount]
  );
  const hasMore = photos.length > visibleCount;
  const remainingCount = photos.length - visibleCount;

  const showMore = useCallback(() => {
    setVisibleCount((prev) => prev + initialVisibleCount);
  }, [initialVisibleCount]);

  const handleDelete = useCallback(
    async (photoId: string): Promise<boolean> => {
      const result = await deleteRoomPhoto(photoId);
      if ("error" in result) return false;

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      router.refresh();
      return true;
    },
    [router]
  );

  const handleUpdateCaption = useCallback(
    async (photoId: string, caption: string | null): Promise<boolean> => {
      const result = await updateRoomPhotoCaption(photoId, caption);
      if ("error" in result) return false;

      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, caption } : p))
      );
      router.refresh();
      return true;
    },
    [router]
  );

  const actionHandlers: PhotoActionHandlers = useMemo(
    () => ({
      onDelete: handleDelete,
      onUpdateCaption: handleUpdateCaption,
    }),
    [handleDelete, handleUpdateCaption]
  );

  const addPhotos = useCallback((newPhotos: PhotoWithProfile[]) => {
    setPhotos((prev) => [...newPhotos, ...prev]);
    setVisibleCount((prev) => prev + newPhotos.length);
  }, []);

  return {
    photos,
    visiblePhotos,
    hasPhotos,
    hasMore,
    remainingCount,
    maxBulkUpload: ROOM_PHOTOS.maxBulkUpload,
    showMore,
    actionHandlers,
    addPhotos,
  };
}
