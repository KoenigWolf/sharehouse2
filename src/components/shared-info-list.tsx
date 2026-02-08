"use client";

import { memo } from "react";
import type { SharedInfo } from "@/domain/shared-info";

interface SharedInfoListProps {
  sharedInfos: SharedInfo[];
}

export const SharedInfoList = memo(function SharedInfoList({
  sharedInfos,
}: SharedInfoListProps) {
  if (sharedInfos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">情報がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sharedInfos.map((info) => (
        <div
          key={info.id}
          className="bg-white border border-border rounded-lg p-4"
        >
          <p className="text-[10px] text-muted-foreground tracking-wide uppercase mb-2">
            {info.title}
          </p>
          <p className="text-sm text-foreground font-medium tracking-wide">
            {info.content}
          </p>
          {info.notes && (
            <p className="text-xs text-muted-foreground mt-2">
              {info.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
});

SharedInfoList.displayName = "SharedInfoList";
