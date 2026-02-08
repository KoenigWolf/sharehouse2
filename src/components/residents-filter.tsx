"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
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
        className="h-7 sm:h-8 w-24 sm:w-40 text-xs sm:text-sm border-border rounded-md focus:border-foreground focus:ring-0"
      />

      <div
        className="flex border border-border rounded-md divide-x divide-slate-200 overflow-hidden"
        role="group"
        aria-label={t("a11y.sortOptions")}
      >
        {SORT_OPTIONS.map((option) => {
          const isSelected = sortBy === option.value;
          return (
            <Button
              key={option.value}
              type="button"
              variant={isSelected ? "default" : "ghost"}
              onClick={() => onSortChange(option.value)}
              aria-label={t(option.ariaKey)}
              aria-pressed={isSelected}
              className={`h-auto text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-1 ${
                !isSelected ? "bg-white text-muted-foreground hover:bg-secondary" : ""
              }`}
            >
              {t(option.labelKey)}
            </Button>
          );
        })}
      </div>
    </div>
  );
});
