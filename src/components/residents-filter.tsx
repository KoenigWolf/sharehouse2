"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";

interface ResidentsFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: "name" | "room_number" | "move_in_date";
  onSortChange: (sort: "name" | "room_number" | "move_in_date") => void;
}

export const ResidentsFilter = memo(function ResidentsFilter({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: ResidentsFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        placeholder="検索..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-8 w-32 sm:w-40 text-sm border-[#e5e5e5] rounded-none focus:border-[#1a1a1a] focus:ring-0"
      />
      <div className="flex border border-[#e5e5e5] divide-x divide-[#e5e5e5]">
        <button
          onClick={() => onSortChange("room_number")}
          className={`text-[11px] px-2 py-1 transition-colors ${
            sortBy === "room_number"
              ? "bg-[#1a1a1a] text-white"
              : "bg-white text-[#737373] hover:bg-[#f5f5f3]"
          }`}
        >
          部屋
        </button>
        <button
          onClick={() => onSortChange("name")}
          className={`text-[11px] px-2 py-1 transition-colors ${
            sortBy === "name"
              ? "bg-[#1a1a1a] text-white"
              : "bg-white text-[#737373] hover:bg-[#f5f5f3]"
          }`}
        >
          名前
        </button>
        <button
          onClick={() => onSortChange("move_in_date")}
          className={`text-[11px] px-2 py-1 transition-colors ${
            sortBy === "move_in_date"
              ? "bg-[#1a1a1a] text-white"
              : "bg-white text-[#737373] hover:bg-[#f5f5f3]"
          }`}
        >
          入居日
        </button>
      </div>
    </div>
  );
});
