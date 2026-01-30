"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ResidentCard } from "@/components/resident-card";
import { Profile } from "@/domain/profile";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import type { Translator } from "@/lib/i18n";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface ResidentsGridProps {
  profiles: Profile[];
  currentUserId: string;
  teaTimeParticipants?: string[];
}

type SortOption = "name" | "room_number" | "move_in_date";
type ViewMode = "grid" | "floor" | "list";
type FloorFilter = "all" | "2F" | "3F" | "4F" | "5F";

function getFloorFromRoom(roomNumber: string | null): string {
  if (!roomNumber) return "?";
  const firstDigit = roomNumber[0];
  return `${firstDigit}F`;
}

function isNewResident(moveInDate: string | null): boolean {
  if (!moveInDate) return false;
  const moveIn = new Date(moveInDate);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return moveIn > threeMonthsAgo;
}

const floorColors: Record<string, { bg: string; border: string; text: string; accent: string; fill: string }> = {
  "2F": { bg: "bg-[#f8faf8]", border: "border-[#a0c9a0]", text: "text-[#6b8b6b]", accent: "#a0c9a0", fill: "#a0c9a0" },
  "3F": { bg: "bg-[#f8f9fa]", border: "border-[#a0b4c9]", text: "text-[#6b7a8b]", accent: "#a0b4c9", fill: "#a0b4c9" },
  "4F": { bg: "bg-[#faf8fa]", border: "border-[#c9a0c4]", text: "text-[#8b6b87]", accent: "#c9a0c4", fill: "#c9a0c4" },
  "5F": { bg: "bg-[#fafaf8]", border: "border-[#c9c0a0]", text: "text-[#8b836b]", accent: "#c9c0a0", fill: "#c9c0a0" },
  "?": { bg: "bg-[#f5f5f3]", border: "border-[#d4d4d4]", text: "text-[#a3a3a3]", accent: "#d4d4d4", fill: "#d4d4d4" },
};

/**
 * 住人一覧グリッドコンポーネント
 * 統計ダッシュボード付き
 */
export function ResidentsGrid({
  profiles,
  currentUserId,
  teaTimeParticipants = [],
}: ResidentsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [sortBy, setSortBy] = useState<SortOption>("room_number");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [floorFilter, setFloorFilter] = useState<FloorFilter>("all");
  const [showStats, setShowStats] = useState(false);
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

  const stats = useMemo(() => {
    const registered = profiles.filter((p) => !p.id.startsWith("mock-"));
    const newResidents = registered.filter((p) => isNewResident(p.move_in_date));
    const teaTimeCount = registered.filter((p) => teaTimeParticipants.includes(p.id)).length;

    const floorStats: Record<string, { total: number; registered: number }> = {
      "2F": { total: 5, registered: 0 },
      "3F": { total: 5, registered: 0 },
      "4F": { total: 5, registered: 0 },
      "5F": { total: 5, registered: 0 },
    };

    registered.forEach((p) => {
      const floor = getFloorFromRoom(p.room_number);
      if (floorStats[floor]) {
        floorStats[floor].registered++;
      }
    });

    return {
      total: 20,
      registered: registered.length,
      unregistered: 20 - registered.length,
      newResidents: newResidents.length,
      teaTimeCount,
      floorStats,
    };
  }, [profiles, teaTimeParticipants]);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
  }, []);

  const filteredAndSortedProfiles = useMemo(() => {
    let result = [...profiles];

    if (floorFilter !== "all") {
      result = result.filter((profile) => {
        const floor = getFloorFromRoom(profile.room_number);
        return floor === floorFilter;
      });
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(
        (profile) =>
          profile.name.toLowerCase().includes(query) ||
          profile.nickname?.toLowerCase().includes(query) ||
          profile.interests?.some((interest) =>
            interest.toLowerCase().includes(query)
          ) ||
          profile.occupation?.toLowerCase().includes(query) ||
          profile.industry?.toLowerCase().includes(query) ||
          profile.mbti?.toLowerCase().includes(query)
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

  const teaTimeSet = useMemo(() => new Set(teaTimeParticipants), [teaTimeParticipants]);

  if (profiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#737373] text-sm">{t("residents.noResidents")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="bg-white border border-[#e5e5e5] rounded-lg mb-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowStats((prev) => !prev)}
          className="w-full h-auto flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-[#fafaf8]"
        >
          <h3 className="text-sm text-[#1a1a1a] tracking-wide">{t("residents.statsTitle")}</h3>
          <motion.span
            animate={{ rotate: showStats ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-[#a3a3a3]"
          >
            <ChevronIcon />
          </motion.span>
        </Button>

        <AnimatePresence initial={false}>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <StatCard
                    label={t("residents.statsRegistered")}
                    value={stats.registered}
                    subValue={`/ ${stats.total}`}
                    color="#1a1a1a"
                  />
                  <StatCard
                    label={t("residents.statsNew")}
                    value={stats.newResidents}
                    subValue={t("residents.statsNewSub")}
                    color="#6b8b6b"
                  />
                  <StatCard
                    label={t("residents.statsTeaTime")}
                    value={stats.teaTimeCount}
                    subValue={t("residents.statsParticipants")}
                    color="#5c7a6b"
                  />
                  <StatCard
                    label={t("residents.statsUnregistered")}
                    value={stats.unregistered}
                    subValue={t("residents.statsRooms")}
                    color="#a3a3a3"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-[#a3a3a3] tracking-wide">{t("residents.floorOccupancy")}</p>
                  <div className="flex gap-2">
                    {(["5F", "4F", "3F", "2F"] as const).map((floor) => {
                      const floorStat = stats.floorStats[floor];
                      const percentage = (floorStat.registered / floorStat.total) * 100;
                      const colors = floorColors[floor];
                      return (
                        <div key={floor} className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] ${colors.text}`}>{floor}</span>
                            <span className="text-[10px] text-[#a3a3a3]">
                              {floorStat.registered}/{floorStat.total}
                            </span>
                          </div>
                          <div className="h-1.5 bg-[#f5f5f3] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                              style={{ backgroundColor: colors.fill }}
                              className="h-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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

          <div className="flex gap-1 bg-[#f5f5f3] p-1 rounded-md">
            {viewModeOptions.map((option) => {
              const isActive = viewMode === option.value;
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setViewMode(option.value)}
                  className={`${
                    isActive
                      ? "bg-white text-[#1a1a1a] hover:bg-white"
                      : "text-[#a3a3a3] hover:text-[#737373]"
                  }`}
                  title={option.label}
                  aria-label={option.label}
                  aria-pressed={isActive}
                >
                  <Icon />
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          {floors.map((floor) => {
            const isAll = floor === "all";
            const isActive = floorFilter === floor;
            const floorStat = isAll ? null : stats.floorStats[floor];
            const colors = isAll ? null : floorColors[floor];

            return (
              <Button
                key={floor}
                type="button"
                variant={isActive && isAll ? "default" : "outline"}
                onClick={() => setFloorFilter(floor)}
                className={`shrink-0 h-auto px-3 sm:px-4 py-2 sm:py-2.5 ${
                  isActive && !isAll
                    ? `${colors?.bg} ${colors?.border} ${colors?.text} hover:${colors?.bg}`
                    : !isActive
                      ? "bg-white border-[#e5e5e5] text-[#737373] hover:border-[#a3a3a3]"
                      : ""
                }`}
              >
                <span className="text-xs sm:text-sm tracking-wide">
                  {isAll ? t("residents.filterAll") : floor}
                </span>
                {floorStat && (
                  <span className={`ml-1.5 text-[10px] sm:text-xs ${isActive ? "" : "text-[#a3a3a3]"}`}>
                    {floorStat.registered}/{floorStat.total}
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#e5e5e5]">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3]" />
            <input
              type="search"
              placeholder={t("residents.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 h-11 sm:h-10 pl-10 pr-4 bg-white border border-[#e5e5e5] rounded-md text-base sm:text-sm text-[#1a1a1a] placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <CloseIcon />
              </Button>
            )}
          </div>

          <div className="relative sm:flex sm:gap-0">
            <div className="flex overflow-x-auto scrollbar-hide sm:overflow-visible -mx-1 px-1 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
              {sortOptions.map((option) => {
                const isActive = sortBy === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="ghost"
                    onClick={() => handleSortChange(option.value)}
                    className="relative h-auto px-4 sm:px-4 py-2.5 sm:py-2 tracking-wide group whitespace-nowrap active:opacity-70 snap-center sm:snap-align-none shrink-0 hover:bg-transparent"
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
                  </Button>
                );
              })}
            </div>
            <div className="sm:hidden absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-[#fafaf8] to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredAndSortedProfiles.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 sm:py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-[#f5f5f3] rounded-lg flex items-center justify-center">
              <SearchIcon className="w-8 h-8 text-[#d4d4d4]" />
            </div>
            <p className="text-[#737373] text-sm">{t("residents.noMatch")}</p>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                setSearchQuery("");
                setFloorFilter("all");
              }}
              className="mt-4 active:scale-[0.98]"
            >
              {t("residents.clearSearch")}
            </Button>
          </motion.div>
        ) : viewMode === "floor" ? (
          <FloorView
            key="floor-view"
            groupedByFloor={groupedByFloor}
            currentUserId={currentUserId}
            floorStats={stats.floorStats}
            teaTimeSet={teaTimeSet}
            t={t}
          />
        ) : viewMode === "list" ? (
          <ListView
            key="list-view"
            profiles={filteredAndSortedProfiles}
            currentUserId={currentUserId}
            teaTimeSet={teaTimeSet}
            t={t}
          />
        ) : (
          <GridView
            key="grid-view"
            profiles={filteredAndSortedProfiles}
            currentUserId={currentUserId}
            teaTimeSet={teaTimeSet}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  label,
  value,
  subValue,
  color,
}: {
  label: string;
  value: number;
  subValue: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-[#a3a3a3] mb-1 tracking-wide">{label}</p>
      <p className="text-2xl sm:text-3xl font-light" style={{ color }}>
        {value}
        <span className="text-sm text-[#a3a3a3] ml-1">{subValue}</span>
      </p>
    </div>
  );
}

function GridView({
  profiles,
  currentUserId,
  teaTimeSet,
}: {
  profiles: Profile[];
  currentUserId: string;
  teaTimeSet: Set<string>;
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
          transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
        >
          <ResidentCard
            profile={profile}
            isCurrentUser={profile.id === currentUserId}
            showTeaTime={true}
            teaTimeEnabled={teaTimeSet.has(profile.id)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

function FloorView({
  groupedByFloor,
  currentUserId,
  floorStats,
  teaTimeSet,
  t,
}: {
  groupedByFloor: Record<string, Profile[]>;
  currentUserId: string;
  floorStats: Record<string, { total: number; registered: number }>;
  teaTimeSet: Set<string>;
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
      {floorsOrder.map((floor, floorIndex) => {
        const profiles = groupedByFloor[floor] || [];
        const colors = floorColors[floor];
        const floorStat = floorStats[floor];

        if (profiles.length === 0) return null;

        return (
          <motion.section
            key={floor}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: floorIndex * 0.1 }}
          >
            <div className={`flex items-center gap-3 mb-4 pb-3 border-b-2 ${colors.border}`}>
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-md ${colors.bg} border ${colors.border}`}
              >
                <span className={`text-base font-medium ${colors.text}`}>{floor}</span>
              </div>
              <div className="flex-1">
                <h3 className={`text-base ${colors.text} tracking-wide`}>
                  {t("residents.floorLabel", { floor: floor.replace("F", "") })}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[#a3a3a3]">
                    {floorStat.registered}/{floorStat.total} {t("residents.registeredShort")}
                  </span>
                  <div className="flex-1 max-w-20 h-1 bg-[#f5f5f3] rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(floorStat.registered / floorStat.total) * 100}%`,
                        backgroundColor: colors.fill,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

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
                    showTeaTime={true}
                    teaTimeEnabled={teaTimeSet.has(profile.id)}
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

function ListView({
  profiles,
  currentUserId,
  teaTimeSet,
  t,
}: {
  profiles: Profile[];
  currentUserId: string;
  teaTimeSet: Set<string>;
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
          transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
        >
          <ResidentListItem
            profile={profile}
            isCurrentUser={profile.id === currentUserId}
            isTeaTimeParticipant={teaTimeSet.has(profile.id)}
            t={t}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

function ResidentListItem({
  profile,
  isCurrentUser,
  isTeaTimeParticipant,
  t,
}: {
  profile: Profile;
  isCurrentUser: boolean;
  isTeaTimeParticipant: boolean;
  t: Translator;
}) {
  const isMockProfile = profile.id.startsWith("mock-");
  const floor = getFloorFromRoom(profile.room_number);
  const colors = floorColors[floor] || floorColors["?"];
  const isNew = isNewResident(profile.move_in_date);

  return (
    <Link
      href={`/profile/${profile.id}`}
      className="block group"
      aria-label={t("a11y.viewProfile", { name: profile.name })}
    >
      <article
        className={`flex items-center gap-4 p-3 sm:p-4 bg-white border rounded-lg transition-all duration-200 active:scale-[0.995] ${
          isCurrentUser
            ? "border-[#1a1a1a]"
            : isMockProfile
            ? "border-dashed border-[#d4d4d4] hover:border-[#a3a3a3]"
            : "border-[#e5e5e5] hover:border-[#1a1a1a]"
        }`}
      >
        <div className="relative shrink-0">
          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 rounded-full">
            <OptimizedAvatarImage
              src={profile.avatar_url}
              alt={profile.name}
              context="card"
              className="w-full h-full"
              fallback={getInitials(profile.name)}
              fallbackClassName="bg-[#f5f5f3] text-[#a3a3a3] text-lg rounded-full w-full h-full flex items-center justify-center"
            />
          </Avatar>
          {isCurrentUser && (
            <span className="absolute -top-1 -right-1 bg-[#1a1a1a] text-white text-[8px] px-1.5 py-0.5 rounded">
              {t("common.you")}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base text-[#1a1a1a] truncate">
              {profile.nickname || profile.name}
            </h3>
            {profile.room_number && (
              <span
                className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}
              >
                {profile.room_number}
              </span>
            )}
            {isNew && !isMockProfile && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f8faf8] text-[#6b8b6b] border border-[#a0c9a0]">
                NEW
              </span>
            )}
            {isTeaTimeParticipant && !isMockProfile && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#5c7a6b] text-white flex items-center gap-0.5">
                <TeaCupIcon />
              </span>
            )}
            {isMockProfile && (
              <span className="text-[10px] text-[#a3a3a3]">
                {t("common.unregistered")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-[11px] sm:text-xs text-[#737373]">
            {profile.occupation && (
              <span>{t(`profileOptions.occupation.${profile.occupation}` as Parameters<typeof t>[0])}</span>
            )}
            {profile.mbti && <span className="text-[#a3a3a3]">{profile.mbti}</span>}
            {profile.interests && profile.interests.length > 0 && (
              <span className="truncate text-[#a3a3a3]">
                {profile.interests.slice(0, 3).join(", ")}
              </span>
            )}
          </div>
        </div>

        <div className="text-[#d4d4d4] group-hover:text-[#a3a3a3] transition-colors shrink-0">
          <ChevronRightIcon />
        </div>
      </article>
    </Link>
  );
}

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

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M6 4L10 8L6 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TeaCupIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 6h10v5a3 3 0 01-3 3H5a3 3 0 01-3-3V6z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 7h1a2 2 0 110 4h-1"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
