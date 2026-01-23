"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/use-i18n";
import type { TranslationKey } from "@/lib/i18n";

type SortOption = "name" | "room_number" | "move_in_date";

interface ResidentsFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

/**
 * Sort button configuration
 */
const SORT_OPTIONS: {
  value: SortOption;
  labelKey: TranslationKey;
  ariaKey: TranslationKey;
}[] = [
  { value: "room_number", labelKey: "residents.sortByRoom", ariaKey: "a11y.sortByRoom" },
  { value: "name", labelKey: "residents.sortByName", ariaKey: "a11y.sortByName" },
  { value: "move_in_date", labelKey: "residents.sortByMoveIn", ariaKey: "a11y.sortByMoveIn" },
];

/**
 * Filter and sort controls for residents list
 */
export const ResidentsFilter = memo(function ResidentsFilter({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: ResidentsFilterProps) {
  const t = useI18n();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2" role="search">
      <label htmlFor="resident-search" className="sr-only">
        {t("a11y.searchResidents")}
      </label>
      <Input
        id="resident-search"
        type="search"
        placeholder={t("residents.searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label={t("a11y.searchResidents")}
        className="h-7 sm:h-8 w-24 sm:w-40 text-xs sm:text-sm border-[#e5e5e5] rounded-none focus:border-[#1a1a1a] focus:ring-0"
      />

      <div
        className="flex border border-[#e5e5e5] divide-x divide-[#e5e5e5]"
        role="group"
        aria-label={t("a11y.sortOptions")}
      >
        {SORT_OPTIONS.map((option) => {
          const isSelected = sortBy === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSortChange(option.value)}
              aria-label={t(option.ariaKey)}
              aria-pressed={isSelected}
              className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-1 transition-colors ${
                isSelected
                  ? "bg-[#1a1a1a] text-white"
                  : "bg-white text-[#737373] hover:bg-[#f5f5f3]"
              }`}
            >
              {t(option.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
});
