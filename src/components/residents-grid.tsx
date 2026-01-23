"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ResidentCard } from "@/components/resident-card";
import { Profile } from "@/types/profile";

interface ResidentsGridProps {
  profiles: Profile[];
  currentUserId: string;
}

type SortOption = "name" | "room_number" | "move_in_date";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "room_number", label: "部屋番号" },
  { value: "name", label: "名前" },
  { value: "move_in_date", label: "入居日" },
];

export function ResidentsGrid({ profiles, currentUserId }: ResidentsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("room_number");

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
          return a.name.localeCompare(b.name, "ja");
        case "room_number":
          const roomA = a.room_number || "999";
          const roomB = b.room_number || "999";
          return roomA.localeCompare(roomB, "ja", { numeric: true });
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
  }, [profiles, searchQuery, sortBy, currentUserId]);

  const sortIndex = SORT_OPTIONS.findIndex((opt) => opt.value === sortBy);

  if (profiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#737373] text-sm">まだ住民が登録されていません</p>
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
              住民一覧
            </h2>
            <p className="text-xs text-[#a3a3a3] mt-1">
              {filteredAndSortedProfiles.length}人
              {searchQuery && ` （${profiles.length}人中）`}
            </p>
          </div>
        </div>

        {/* フィルターバー */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]">
          {/* 検索 */}
          <div className="relative">
            <input
              type="search"
              placeholder="名前・趣味で検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 h-10 px-4 bg-white border border-[#e5e5e5] text-sm text-[#1a1a1a] placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
            />
          </div>

          {/* ソート */}
          <div className="relative">
            <div className="flex text-sm">
              {SORT_OPTIONS.map((option) => {
                const isActive = sortBy === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSortChange(option.value)}
                    className={`px-4 py-2 tracking-wide transition-colors ${
                      isActive ? "text-[#1a1a1a]" : "text-[#a3a3a3]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {/* アンダーライン */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-[#e5e5e5]" />
            <motion.div
              className="absolute bottom-0 h-px bg-[#1a1a1a]"
              initial={false}
              animate={{
                left: `${(sortIndex / SORT_OPTIONS.length) * 100}%`,
                width: `${100 / SORT_OPTIONS.length}%`,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
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
              条件に一致する住民がいません
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm text-[#1a1a1a] hover:text-[#737373] mt-4 transition-colors"
            >
              検索をクリア
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
