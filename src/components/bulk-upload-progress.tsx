"use client";

import { memo } from "react";
import { m } from "framer-motion";
import { useI18n } from "@/hooks/use-i18n";
import type { UploadItem, UploadItemStatus } from "@/hooks/use-bulk-upload";

interface BulkUploadProgressProps {
  items: UploadItem[];
  completedCount: number;
  totalCount: number;
}

const statusColorMap: Record<UploadItemStatus, string> = {
  pending: "text-muted-foreground",
  compressing: "text-muted-foreground",
  uploading: "text-muted-foreground",
  done: "text-success",
  error: "text-error",
};

function getStatusText(status: UploadItemStatus, t: ReturnType<typeof useI18n>): string {
  switch (status) {
    case "pending": return t("roomPhotos.statusPending");
    case "compressing": return t("roomPhotos.statusCompressing");
    case "uploading": return t("roomPhotos.statusUploading");
    case "done": return t("roomPhotos.statusDone");
    case "error": return t("roomPhotos.statusError");
  }
}

const StatusLabel = memo(function StatusLabel({
  status,
}: {
  status: UploadItemStatus;
}) {
  const t = useI18n();
  return (
    <span className={`text-[10px] shrink-0 ${statusColorMap[status]}`}>
      {getStatusText(status, t)}
    </span>
  );
});

StatusLabel.displayName = "StatusLabel";

export const BulkUploadProgress = memo(function BulkUploadProgress({
  items,
  completedCount,
  totalCount,
}: BulkUploadProgressProps) {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <m.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="mb-4 py-3 px-4 bg-card border border-border rounded-lg"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-mono">
          {completedCount} / {totalCount}
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mb-3">
        <m.div
          className="h-full bg-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      <div className="max-h-32 overflow-y-auto space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 py-0.5"
          >
            <span className="text-[11px] text-muted-foreground truncate min-w-0">
              {item.fileName}
            </span>
            <StatusLabel status={item.status} />
          </div>
        ))}
      </div>
    </m.div>
  );
});

BulkUploadProgress.displayName = "BulkUploadProgress";
