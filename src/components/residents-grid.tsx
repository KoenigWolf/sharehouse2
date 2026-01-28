"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ResidentCard } from "@/components/resident-card";
import { Profile } from "@/domain/profile";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import type { Translator } from "@/lib/i18n";
import { useDebounce } from "@/hooks/use-debounce";

interface ResidentsGridProps {
  profiles: Profile[];
  currentUserId: string;
}

type SortOption = "name" | "room_number" | "move_in_date";
type ViewMode = "grid" | "floor" | "list";
type FloorFilter = "all" | "2F" | "3F" | "4F" | "5F";

// 部屋番号から階層を取得
function getFloorFromRoom(roomNumber: string | null): string {
  if (!roomNumber) return "?";
  const firstDigit = roomNumber[0];
  return `${firstDigit}F`;
}

// 階層ごとのカラーテーマ
const floorColors: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  "2F": { bg: "bg-[#f8faf8]", border: "border-[#a0c9a0]", text: "text-[#6b8b6b]", accent: "#a0c9a0" },
  "3F": { bg: "bg-[#f8f9fa]", border: "border-[#a0b4c9]", text: "text-[#6b7a8b]", accent: "#a0b4c9" },
  "4F": { bg: "bg-[#faf8fa]", border: "border-[#c9a0c4]", text: "text-[#8b6b87]", accent: "#c9a0c4" },
  "5F": { bg: "bg-[#fafaf8]", border: "border-[#c9c0a0]", text: "text-[#8b836b]", accent: "#c9c0a0" },
  "?": { bg: "bg-[#f5f5f3]", border: "border-[#d4d4d4]", text: "text-[#a3a3a3]", accent: "#d4d4d4" },
};

/**
 * 住人一覧グリッドコンポーネント
 *
 * 検索フィルタリング（300ms debounce）とソート（部屋番号/名前/入居日）機能付き。
 * 表示モード: グリッド / 階層別 / リスト
 */
export function ResidentsGrid({ profiles, currentUserId }: ResidentsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [sortBy, setSortBy] = useState<SortOption>("room_number");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [floorFilter, setFloorFilter] = useState<FloorFilter>("all");
  const t = useI18n();
  const locale = useLocale();

  const sortOptions = useMemo(
    () => [
      { value: "room_number" as const, label: t("residents.sortByRoom") },
      { value: "name" as const, label: t("residents.sortByName") },
      { value: "move_in_date" as const, label: t("residents.sortByMoveIn") },
    ],
    [t]
  );

  const viewModeOptions = useMemo(
    () => [
      { value: "grid" as const, label: t("residents.viewGrid"), icon: GridIcon },
      { value: "floor" as const, label: t("residents.viewFloor"), icon: FloorIcon },
      { value: "list" as const, label: t("residents.viewList"), icon: ListIcon },
    ],
    [t]
  );

  const floors: FloorFilter[] = ["all", "2F", "3F", "4F", "5F"];

  // 階層別統計
  const floorStats = useMemo(() => {
    const stats: Record<string, { total: number; registered: number }> = {
      "2F": { total: 5, registered: 0 },
      "3F": { total: 5, registered: 0 },
      "4F": { total: 5, registered: 0 },
      "5F": { total: 5, registered: 0 },
    };
    profiles.forEach((p) => {
      const floor = getFloorFromRoom(p.room_number);
      if (stats[floor] && !p.id.startsWith("mock-")) {
        stats[floor].registered++;
      }
    });
    return stats;
  }, [profiles]);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
  }, []);

  const filteredAndSortedProfiles = useMemo(() => {
    let result = [...profiles];

    // 階層フィルター
    if (floorFilter !== "all") {
      result = result.filter((profile) => {
        const floor = getFloorFromRoom(profile.room_number);
        return floor === floorFilter;
      });
    }

    // 検索フィルター
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(
        (profile) =>
          profile.name.toLowerCase().includes(query) ||
          profile.interests?.some((interest) =>
            interest.toLowerCase().includes(query)
          ) ||
          profile.occupation?.toLowerCase().includes(query) ||
          profile.industry?.toLowerCase().includes(query)
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
  }, [profiles, debouncedSearchQuery, sortBy, floorFilter, currentUserId, locale]);

  // 階層別グループ
  const groupedByFloor = useMemo(() => {
    const groups: Record<string, Profile[]> = {
      "2F": [],
      "3F": [],
      "4F": [],
      "5F": [],
    };
    filteredAndSortedProfiles.forEach((profile) => {
      const floor = getFloorFromRoom(profile.room_number);
      if (groups[floor]) {
        groups[floor].push(profile);
      }
    });
    return groups;
  }, [filteredAndSortedProfiles]);

  if (profiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#737373] text-sm">{t("residents.noResidents")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ヘッダー: タイトル + 統計 */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg sm:text-xl text-[#1a1a1a] tracking-wide font-light">
              {t("residents.title")}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#a3a3a3] mt-1">
              {t("residents.countLabel", { count: filteredAndSortedProfiles.length })}
              {(searchQuery || floorFilter !== "all") &&
                ` ${t("residents.countOf", { total: profiles.length })}`}
            </p>
          </div>

          {/* 表示モード切替 */}
          <div className="flex gap-1 bg-[#f5f5f3] p-1">
            {viewModeOptions.map((option) => {
              const isActive = viewMode === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setViewMode(option.value)}
                  className={`p-2 transition-colors ${
                    isActive
                      ? "bg-white text-[#1a1a1a]"
                      : "text-[#a3a3a3] hover:text-[#737373]"
                  }`}
                  title={option.label}
                  aria-label={option.label}
                  aria-pressed={isActive}
                >
                  <Icon />
                </button>
              );
            })}
          </div>
        </div>

        {/* 階層統計バー */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          {floors.map((floor) => {
            const isAll = floor === "all";
            const isActive = floorFilter === floor;
            const stats = isAll ? null : floorStats[floor];
            const colors = isAll ? null : floorColors[floor];

            return (
              <button
                key={floor}
                type="button"
                onClick={() => setFloorFilter(floor)}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 border transition-all ${
                  isActive
                    ? isAll
                      ? "bg-[#1a1a1a] border-[#1a1a1a] text-white"
                      : `${colors?.bg} ${colors?.border} ${colors?.text}`
                    : "bg-white border-[#e5e5e5] text-[#737373] hover:border-[#a3a3a3]"
                }`}
              >
                <span className="text-xs sm:text-sm tracking-wide">
                  {isAll ? t("residents.filterAll") : floor}
                </span>
                {stats && (
                  <span className={`ml-1.5 text-[10px] sm:text-xs ${isActive ? "" : "text-[#a3a3a3]"}`}>
                    {stats.registered}/{stats.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* フィルターバー: 検索 + ソート */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#e5e5e5]">
          {/* 検索 */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3]" />
            <input
              type="search"
              placeholder={t("residents.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 h-11 sm:h-10 pl-10 pr-4 bg-white border border-[#e5e5e5] text-base sm:text-sm text-[#1a1a1a] placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
            />
          </div>

          {/* ソート */}
          <div className="relative sm:flex sm:gap-0">
            <div className="flex overflow-x-auto scrollbar-hide sm:overflow-visible -mx-1 px-1 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
              {sortOptions.map((option) => {
                const isActive = sortBy === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSortChange(option.value)}
                    className="relative px-4 sm:px-4 py-2.5 sm:py-2 tracking-wide transition-colors group whitespace-nowrap active:opacity-70 snap-center sm:snap-align-none flex-shrink-0"
                  >
                    <span
                      className={`text-sm ${
                        isActive
                          ? "text-[#1a1a1a] font-medium"
                          : "text-[#a3a3a3] group-hover:text-[#737373]"
                      }`}
                    >
                      {option.label}
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="sort-underline"
                        className="absolute bottom-0 left-3 right-3 sm:left-4 sm:right-4 h-px bg-[#1a1a1a]"
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="sm:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#fafaf8] to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <AnimatePresence mode="wait">
        {filteredAndSortedProfiles.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 sm:py-16"
          >
            <p className="text-[#737373] text-sm">{t("residents.noMatch")}</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFloorFilter("all");
              }}
              className="mt-4 px-5 py-3 text-sm text-[#1a1a1a] border border-[#e5e5e5] hover:border-[#1a1a1a] active:scale-[0.98] transition-all"
            >
              {t("residents.clearSearch")}
            </button>
          </motion.div>
        ) : viewMode === "floor" ? (
          <FloorView
            key="floor-view"
            groupedByFloor={groupedByFloor}
            currentUserId={currentUserId}
            floorStats={floorStats}
            t={t}
          />
        ) : viewMode === "list" ? (
          <ListView
            key="list-view"
            profiles={filteredAndSortedProfiles}
            currentUserId={currentUserId}
            t={t}
          />
        ) : (
          <GridView
            key="grid-view"
            profiles={filteredAndSortedProfiles}
            currentUserId={currentUserId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// グリッドビュー
function GridView({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
    >
      {profiles.map((profile, index) => (
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
  );
}

// 階層別ビュー
function FloorView({
  groupedByFloor,
  currentUserId,
  floorStats,
  t,
}: {
  groupedByFloor: Record<string, Profile[]>;
  currentUserId: string;
  floorStats: Record<string, { total: number; registered: number }>;
  t: Translator;
}) {
  const floorsOrder = ["5F", "4F", "3F", "2F"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {floorsOrder.map((floor) => {
        const profiles = groupedByFloor[floor] || [];
        const colors = floorColors[floor];
        const stats = floorStats[floor];

        if (profiles.length === 0) return null;

        return (
          <motion.section
            key={floor}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* 階層ヘッダー */}
            <div className={`flex items-center gap-3 mb-4 pb-3 border-b-2 ${colors.border}`}>
              <div
                className={`w-10 h-10 flex items-center justify-center ${colors.bg} border ${colors.border}`}
              >
                <span className={`text-sm font-medium ${colors.text}`}>{floor}</span>
              </div>
              <div>
                <h3 className={`text-base ${colors.text} tracking-wide`}>
                  {t("residents.floorLabel", { floor: floor.replace("F", "") })}
                </h3>
                <p className="text-[10px] text-[#a3a3a3]">
                  {stats.registered}/{stats.total} {t("residents.registeredShort")}
                </p>
              </div>
            </div>

            {/* カードグリッド */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {profiles.map((profile, index) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <ResidentCard
                    profile={profile}
                    isCurrentUser={profile.id === currentUserId}
                    floorAccent={colors.accent}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        );
      })}
    </motion.div>
  );
}

// リストビュー
function ListView({
  profiles,
  currentUserId,
  t,
}: {
  profiles: Profile[];
  currentUserId: string;
  t: Translator;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-2"
    >
      {profiles.map((profile, index) => (
        <motion.div
          key={profile.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.02 }}
        >
          <ResidentListItem
            profile={profile}
            isCurrentUser={profile.id === currentUserId}
            t={t}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

// リストアイテム
import Link from "next/link";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

function ResidentListItem({
  profile,
  isCurrentUser,
  t,
}: {
  profile: Profile;
  isCurrentUser: boolean;
  t: Translator;
}) {
  const isMockProfile = profile.id.startsWith("mock-");
  const floor = getFloorFromRoom(profile.room_number);
  const colors = floorColors[floor] || floorColors["?"];

  return (
    <Link
      href={`/profile/${profile.id}`}
      className="block group"
      aria-label={t("a11y.viewProfile", { name: profile.name })}
    >
      <article
        className={`flex items-center gap-4 p-3 sm:p-4 bg-white border transition-all duration-200 active:scale-[0.995] ${
          isCurrentUser
            ? "border-[#1a1a1a]"
            : isMockProfile
            ? "border-dashed border-[#d4d4d4] hover:border-[#a3a3a3]"
            : "border-[#e5e5e5] hover:border-[#1a1a1a]"
        }`}
      >
        {/* アバター */}
        <div className="relative flex-shrink-0">
          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 rounded-none">
            <OptimizedAvatarImage
              src={profile.avatar_url}
              alt={profile.name}
              context="card"
              className="w-full h-full"
              fallback={getInitials(profile.name)}
              fallbackClassName="bg-[#f5f5f3] text-[#a3a3a3] text-lg rounded-none w-full h-full flex items-center justify-center"
            />
          </Avatar>
          {isCurrentUser && (
            <span className="absolute -top-1 -right-1 bg-[#1a1a1a] text-white text-[8px] px-1.5 py-0.5">
              {t("common.you")}
            </span>
          )}
        </div>

        {/* 情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base text-[#1a1a1a] truncate">
              {profile.name}
            </h3>
            {profile.room_number && (
              <span
                className={`text-[10px] sm:text-xs px-1.5 py-0.5 ${colors.bg} ${colors.text}`}
              >
                {profile.room_number}
              </span>
            )}
            {isMockProfile && (
              <span className="text-[10px] text-[#a3a3a3]">
                {t("common.unregistered")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-[11px] sm:text-xs text-[#737373]">
            {profile.occupation && <span>{profile.occupation}</span>}
            {profile.mbti && <span className="text-[#a3a3a3]">{profile.mbti}</span>}
            {profile.interests && profile.interests.length > 0 && (
              <span className="truncate text-[#a3a3a3]">
                {profile.interests.slice(0, 3).join(", ")}
              </span>
            )}
          </div>
        </div>

        {/* 矢印 */}
        <div className="text-[#d4d4d4] group-hover:text-[#a3a3a3] transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4L10 8L6 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </article>
    </Link>
  );
}

// アイコンコンポーネント
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function FloorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="5" cy="4" r="1.5" fill="currentColor" />
      <circle cx="8" cy="4" r="1.5" fill="currentColor" />
      <circle cx="5" cy="8" r="1.5" fill="currentColor" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="11" cy="8" r="1.5" fill="currentColor" />
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="2.5" cy="4" r="1" fill="currentColor" />
      <circle cx="2.5" cy="8" r="1" fill="currentColor" />
      <circle cx="2.5" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
