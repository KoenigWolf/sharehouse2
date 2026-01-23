"use client";

import { Input } from "@/components/ui/input";

interface ResidentsFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: "name" | "room_number" | "move_in_date";
  onSortChange: (sort: "name" | "room_number" | "move_in_date") => void;
  interestFilter: string | null;
  onInterestFilterChange: (interest: string | null) => void;
  availableInterests: string[];
}

export function ResidentsFilter({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  interestFilter,
  onInterestFilterChange,
  availableInterests,
}: ResidentsFilterProps) {
  return (
    <div className="space-y-4">
      {/* 検索 */}
      <div>
        <Input
          type="text"
          placeholder="名前や趣味で検索..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-11 border-[#e5e5e5] rounded-none focus:border-[#1a1a1a] focus:ring-0"
        />
      </div>

      {/* ソートと趣味フィルター */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* ソート */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#737373]">並び替え:</span>
          <div className="flex gap-1">
            <button
              onClick={() => onSortChange("name")}
              className={`text-xs px-3 py-1.5 border transition-colors ${
                sortBy === "name"
                  ? "border-[#1a1a1a] text-[#1a1a1a] bg-white"
                  : "border-[#e5e5e5] text-[#737373] hover:border-[#1a1a1a]"
              }`}
            >
              名前
            </button>
            <button
              onClick={() => onSortChange("room_number")}
              className={`text-xs px-3 py-1.5 border transition-colors ${
                sortBy === "room_number"
                  ? "border-[#1a1a1a] text-[#1a1a1a] bg-white"
                  : "border-[#e5e5e5] text-[#737373] hover:border-[#1a1a1a]"
              }`}
            >
              部屋番号
            </button>
            <button
              onClick={() => onSortChange("move_in_date")}
              className={`text-xs px-3 py-1.5 border transition-colors ${
                sortBy === "move_in_date"
                  ? "border-[#1a1a1a] text-[#1a1a1a] bg-white"
                  : "border-[#e5e5e5] text-[#737373] hover:border-[#1a1a1a]"
              }`}
            >
              入居日
            </button>
          </div>
        </div>

        {/* 趣味フィルター */}
        {availableInterests.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#737373]">趣味:</span>
            <button
              onClick={() => onInterestFilterChange(null)}
              className={`text-xs px-3 py-1.5 border transition-colors ${
                interestFilter === null
                  ? "border-[#1a1a1a] text-[#1a1a1a] bg-white"
                  : "border-[#e5e5e5] text-[#737373] hover:border-[#1a1a1a]"
              }`}
            >
              すべて
            </button>
            {availableInterests.slice(0, 5).map((interest) => (
              <button
                key={interest}
                onClick={() => onInterestFilterChange(interest)}
                className={`text-xs px-3 py-1.5 border transition-colors ${
                  interestFilter === interest
                    ? "border-[#b94a48] text-[#b94a48] bg-white"
                    : "border-[#e5e5e5] text-[#737373] hover:border-[#1a1a1a]"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
