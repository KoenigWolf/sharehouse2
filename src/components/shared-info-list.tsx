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
        <p className="text-sm text-[#737373]">情報がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sharedInfos.map((info) => (
        <div
          key={info.id}
          className="bg-white border border-[#e5e5e5] rounded-lg p-4"
        >
          <p className="text-[10px] text-[#a3a3a3] tracking-wide uppercase mb-2">
            {info.title}
          </p>
          <p className="text-sm text-[#1a1a1a] font-medium tracking-wide">
            {info.content}
          </p>
          {info.notes && (
            <p className="text-xs text-[#737373] mt-2">
              {info.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
});

SharedInfoList.displayName = "SharedInfoList";
