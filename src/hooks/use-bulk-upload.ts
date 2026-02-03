"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  compressImage,
  getOutputFormat,
} from "@/lib/utils/image-compression";
import { extractTakenAt } from "@/lib/utils/exif";
import { registerBulkPhotos } from "@/lib/room-photos/actions";
import type { BulkPhotoItem } from "@/lib/room-photos/actions";
import { useI18n } from "@/hooks/use-i18n";
import { ROOM_PHOTOS } from "@/lib/constants/config";

export type UploadItemStatus =
  | "pending"
  | "compressing"
  | "uploading"
  | "done"
  | "error";

export interface UploadItem {
  id: string;
  fileName: string;
  status: UploadItemStatus;
  error?: string;
}

interface Feedback {
  type: "success" | "error";
  message: string;
}

const CONCURRENCY = 5;

/**
 * 一括アップロードフック
 *
 * クライアント側で圧縮 → Supabase Storageへ直接並列アップロード →
 * サーバーアクションでバッチDB登録、の流れを管理する。
 */
export function useBulkUpload() {
  const router = useRouter();
  const t = useI18n();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const updateItem = useCallback(
    (id: string, update: Partial<UploadItem>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...update } : item
        )
      );
    },
    []
  );

  const processFile = useCallback(
    async (
      item: UploadItem,
      file: File,
      userId: string,
      supabase: ReturnType<typeof createClient>
    ): Promise<BulkPhotoItem | null> => {
      try {
        updateItem(item.id, { status: "compressing" });

        // Canvas 圧縮で EXIF が消えるため、圧縮前に抽出
        const takenAt =
          (await extractTakenAt(file)) ??
          new Date(file.lastModified).toISOString();

        const compressed = await compressImage(file);

        updateItem(item.id, { status: "uploading" });
        const { extension, mimeType } = getOutputFormat();
        const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const fileName = `${userId}/${uniqueId}.${extension}`;

        const { error } = await supabase.storage
          .from("room-photos")
          .upload(fileName, compressed, {
            contentType: mimeType,
            cacheControl: "3600",
          });

        if (error) throw error;

        updateItem(item.id, { status: "done" });
        setCompletedCount((prev) => prev + 1);
        return { storagePath: fileName, takenAt };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed";
        updateItem(item.id, { status: "error", error: message });
        setCompletedCount((prev) => prev + 1);
        return null;
      }
    },
    [updateItem]
  );

  const startUpload = useCallback(
    async (files: File[], maxRemaining?: number) => {
      if (files.length === 0) return;

      const limit = Math.min(
        maxRemaining ?? ROOM_PHOTOS.maxBulkUpload,
        ROOM_PHOTOS.maxBulkUpload
      );
      if (files.length > limit) {
        setFeedback({
          type: "error",
          message: t("roomPhotos.tooManyFiles", { count: limit }),
        });
        return;
      }

      setIsUploading(true);
      setCompletedCount(0);
      setFeedback(null);

      const newItems: UploadItem[] = files.map((file, i) => ({
        id: `${Date.now()}_${i}`,
        fileName: file.name,
        status: "pending" as const,
      }));
      setItems(newItems);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFeedback({ type: "error", message: t("errors.unauthorized") });
        setIsUploading(false);
        return;
      }

      const queue = newItems.map((item, i) => ({ item, file: files[i] }));
      let queueIndex = 0;
      const uploadedItems: BulkPhotoItem[] = [];

      const processNext = async (): Promise<void> => {
        while (queueIndex < queue.length) {
          const currentIndex = queueIndex++;
          const { item, file } = queue[currentIndex];
          const result = await processFile(item, file, user.id, supabase);
          if (result) uploadedItems.push(result);
        }
      };

      const workerCount = Math.min(CONCURRENCY, files.length);
      await Promise.all(
        Array.from({ length: workerCount }, () => processNext())
      );

      if (uploadedItems.length > 0) {
        const result = await registerBulkPhotos(uploadedItems);
        if ("error" in result) {
          setFeedback({ type: "error", message: result.error });
          setIsUploading(false);
          return;
        }
      }

      const failedCount = files.length - uploadedItems.length;
      if (failedCount > 0) {
        setFeedback({
          type: "error",
          message: t("roomPhotos.bulkUploadPartial", {
            success: uploadedItems.length,
            failed: failedCount,
          }),
        });
      } else {
        setFeedback({
          type: "success",
          message: t("roomPhotos.bulkUploadComplete", {
            count: uploadedItems.length,
          }),
        });
      }

      setIsUploading(false);
      router.refresh();
    },
    [processFile, router, t]
  );

  return {
    items,
    isUploading,
    completedCount,
    totalCount: items.length,
    feedback,
    startUpload,
  };
}
