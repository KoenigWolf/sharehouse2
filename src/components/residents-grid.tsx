"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ResidentCard } from "@/components/resident-card";
import { Profile } from "@/domain/profile";
import { useI18n } from "@/hooks/use-i18n";
import { normalizeLocale } from "@/lib/i18n";

interface ResidentsGridProps {
  profiles: Profile[];
  currentUserId: string;
}

type SortOption = "name" | "room_number" | "move_in_date";

export function ResidentsGrid({ profiles, currentUserId }: ResidentsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("room_number");
  const t = useI18n();
  const locale = normalizeLocale(
    typeof document !== "undefined"
      ? document.documentElement.lang || navigator.language
      : undefined
  );

  const sortOptions = useMemo(
    () => [
      { value: "room_number" as const, label: t("residents.sortByRoom") },
      { value: "name" as const, label: t("residents.sortByName") },
      { value: "move_in_date" as const, label: t("residents.sortByMoveIn") },
    ],
    [t]
  );

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
  }, []);

  const filteredAndSortedProfiles = useMemo(() => {
    let result = [...profiles];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (profile) =>
          profile.name.toLowerCase().includes(query) ||
          profile.interests?.some((interest) =>
            interest.toLowerCase().includes(query)
          )
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          if (a.id === currentUserId) return -1;
          if (b.id === currentUserId) return 1;
          return a.name.localeCompare(b.name, locale);
        case "room_number":
          const roomA = a.room_number || "999";
          const roomB = b.room_number || "999";
          return roomA.localeCompare(roomB, locale, { numeric: true });
        case "move_in_date":
          if (a.id === currentUserId) return -1;
          if (b.id === currentUserId) return 1;
          const dateA = a.move_in_date || "9999-12-31";
          const dateB = b.move_in_date || "9999-12-31";
          return dateA.localeCompare(dateB);
        default:
          return 0;
      }
    });

    return result;
  }, [profiles, searchQuery, sortBy, currentUserId, locale]);

  if (profiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#737373] text-sm">{t("residents.noResidents")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー: タイトル + 検索 + ソート */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl text-[#1a1a1a] tracking-wide font-light">
              {t("residents.title")}
            </h2>
            <p className="text-xs text-[#a3a3a3] mt-1">
              {t("residents.countLabel", {
                count: filteredAndSortedProfiles.length,
              })}
              {searchQuery &&
                ` ${t("residents.countOf", { total: profiles.length })}`}
            </p>
          </div>
        </div>

        {/* フィルターバー */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]">
          {/* 検索 */}
          <div className="relative">
            <input
              type="search"
              placeholder={t("residents.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 h-10 px-4 bg-white border border-[#e5e5e5] text-sm text-[#1a1a1a] placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
            />
          </div>

          {/* ソート */}
          <div className="flex text-sm">
            {sortOptions.map((option) => {
              const isActive = sortBy === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSortChange(option.value)}
                  className="relative px-4 py-2 tracking-wide transition-colors group"
                >
                  <span
                    className={
                      isActive
                        ? "text-[#1a1a1a]"
                        : "text-[#a3a3a3] group-hover:text-[#737373]"
                    }
                  >
                    {option.label}
                  </span>
                  {/* アンダーライン */}
                  {isActive && (
                    <motion.span
                      layoutId="sort-underline"
                      className="absolute bottom-0 left-4 right-4 h-px bg-[#1a1a1a]"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* グリッド or 空状態 */}
      <AnimatePresence mode="wait">
        {filteredAndSortedProfiles.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <p className="text-[#737373] text-sm">
              {t("residents.noMatch")}
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm text-[#1a1a1a] hover:text-[#737373] mt-4 transition-colors"
            >
              {t("residents.clearSearch")}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {filteredAndSortedProfiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
              >
                <ResidentCard
                  profile={profile}
                  isCurrentUser={profile.id === currentUserId}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
