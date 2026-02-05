"use client";

import { useState, useMemo, useCallback } from "react";
import { m, motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ResidentCard } from "@/components/resident-card";
import { Profile } from "@/domain/profile";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import type { Translator } from "@/lib/i18n";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { getFloorFromRoom, isNewResident, FLOOR_COLORS, type FloorId } from "@/lib/utils/residents";
import { VibeInput } from "@/components/vibe-input";

interface ResidentsGridProps {
  profiles: Profile[];
  currentUserId: string;
  teaTimeParticipants?: string[];
}

type SortOption = "name" | "room_number" | "move_in_date";
type ViewMode = "grid" | "floor" | "list";
type FloorFilter = "all" | "2F" | "3F" | "4F" | "5F";

const SEARCH_VISIBLE_THRESHOLD = 30;

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

  const floorStats = useMemo(() => {
    const registered = profiles.filter((p) => !p.id.startsWith("mock-"));
    const result: Record<string, { total: number; registered: number }> = {
      "2F": { total: 5, registered: 0 },
      "3F": { total: 5, registered: 0 },
      "4F": { total: 5, registered: 0 },
      "5F": { total: 5, registered: 0 },
    };
    registered.forEach((p) => {
      const floor = getFloorFromRoom(p.room_number);
      if (result[floor]) {
        result[floor].registered++;
      }
    });
    return result;
  }, [profiles]);

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

  const totalCount = profiles.length;
  const displayCount = filteredAndSortedProfiles.length;

  const currentUserProfile = useMemo(
    () => profiles.find((p) => p.id === currentUserId),
    [profiles, currentUserId],
  );

  if (totalCount === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500 text-sm">{t("residents.noResidents")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      {currentUserId && (
        <div className="max-w-2xl mx-auto w-full">
          <VibeInput
            currentVibe={currentUserProfile?.vibe?.message}
            isLoggedIn={!!currentUserId}
          />
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg sm:text-xl text-slate-900 tracking-wide font-light">
              {t("residents.title")}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
              {t("residents.countLabel", { count: displayCount })}
              {(searchQuery || floorFilter !== "all") &&
                ` ${t("residents.countOf", { total: totalCount })}`}
            </p>
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
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
                  className={`${isActive
                    ? "bg-white text-brand-500 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                    } rounded-lg transition-all`}
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

        <div className="sticky top-[64px] z-30 bg-slate-50/95 backdrop-blur-sm -mx-4 px-4 py-3 sm:relative sm:top-0 sm:bg-transparent sm:backdrop-none sm:mx-0 sm:px-0 sm:py-0">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1 sm:pb-0">
            {floors.map((floor) => {
              const isAll = floor === "all";
              const isActive = floorFilter === floor;
              const floorStat = isAll ? null : floorStats[floor];
              const colors = isAll ? null : FLOOR_COLORS[floor as keyof typeof FLOOR_COLORS];

              return (
                <Button
                  key={floor}
                  type="button"
                  variant="outline"
                  onClick={() => setFloorFilter(floor)}
                  className={`shrink-0 h-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all ${isActive
                    ? isAll
                      ? "bg-brand-500 text-white shadow-lg shadow-brand-200 border-brand-500"
                      : `${colors?.bg} ${colors?.text} border-transparent shadow-sm`
                    : "bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                >
                  <span className="text-sm font-semibold tracking-tight">
                    {isAll ? t("residents.filterAll") : floor}
                  </span>
                  {floorStat && (
                    <span className={`ml-2 text-xs font-medium ${isActive ? "opacity-70" : "text-slate-400"}`}>
                      {floorStat.registered}/{floorStat.total}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-4 sm:pb-4 sm:border-b sm:border-slate-200">
            {totalCount >= SEARCH_VISIBLE_THRESHOLD && (
              <div className="relative group">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                <input
                  type="search"
                  placeholder={t("residents.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-80 h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-transparent"
                  >
                    <CloseIcon />
                  </Button>
                )}
              </div>
            )}

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
                        className={`text-sm ${isActive
                          ? "text-slate-900 font-medium"
                          : "text-slate-400 group-hover:text-slate-500"
                          }`}
                      >
                        {option.label}
                      </span>
                      {isActive && (
                        <motion.span
                          layoutId="sort-underline"
                          className="absolute bottom-0 left-3 right-3 sm:left-4 sm:right-4 h-px bg-slate-900"
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        />
                      )}
                    </Button>
                  );
                })}
              </div>
              <div className="sm:hidden absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-white to-transparent pointer-events-none" />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {filteredAndSortedProfiles.length === 0 ? (
            <m.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 sm:py-16"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-lg flex items-center justify-center">
                <SearchIcon className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm">{t("residents.noMatch")}</p>
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
            </m.div>
          ) : viewMode === "floor" ? (
            <FloorView
              key="floor-view"
              groupedByFloor={groupedByFloor}
              currentUserId={currentUserId}
              floorStats={floorStats}
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
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8"
    >
      {profiles.map((profile, index) => (
        <m.div
          key={profile.id}
          className="h-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: Math.min(index * 0.04, 0.4),
            ease: [0.23, 1, 0.32, 1]
          }}
        >
          <ResidentCard
            profile={profile}
            isCurrentUser={profile.id === currentUserId}
            showTeaTime={true}
            teaTimeEnabled={teaTimeSet.has(profile.id)}
          />
        </m.div>
      ))}
    </m.div>
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
  const floorsOrder: FloorId[] = ["5F", "4F", "3F", "2F"];

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-16 sm:space-y-20"
    >
      {floorsOrder.map((floor, floorIndex) => {
        const profiles = groupedByFloor[floor] || [];
        const colors = FLOOR_COLORS[floor];
        const floorStat = floorStats[floor];

        if (profiles.length === 0) return null;

        return (
          <m.section
            key={floor}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: floorIndex * 0.1, ease: "easeOut" }}
          >
            <div className={`flex items-center gap-6 mb-8 pb-6 border-b border-slate-100`}>
              <div
                className={`w-14 h-14 flex items-center justify-center rounded-2xl shadow-sm border ${colors.border} ${colors.bg}`}
              >
                <span className={`text-xl font-bold tracking-tight ${colors.text}`}>{floor}</span>
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold tracking-tight text-slate-900`}>
                  {t("residents.floorLabel", { floor: floor.replace("F", "") })}
                </h3>
                <div className="flex items-center gap-6 mt-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {floorStat.registered}/{floorStat.total} {t("residents.registeredShort")}
                  </span>
                  <div className="flex-1 max-w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(floorStat.registered / floorStat.total) * 100}%` }}
                      transition={{ duration: 1, ease: [0.23, 1, 0.32, 1], delay: floorIndex * 0.1 + 0.3 }}
                      className={`h-full rounded-full ${colors.accent.replace("text-", "bg-")}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8">
              {profiles.map((profile, index) => (
                <m.div
                  key={profile.id}
                  className="h-full"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.04, ease: "easeOut" }}
                >
                  <ResidentCard
                    profile={profile}
                    isCurrentUser={profile.id === currentUserId}
                    floorAccent={colors.accent}
                    showTeaTime={true}
                    teaTimeEnabled={teaTimeSet.has(profile.id)}
                  />
                </m.div>
              ))}
            </div>
          </m.section>
        );
      })}
    </m.div>
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
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-2"
    >
      {profiles.map((profile, index) => (
        <m.div
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
        </m.div>
      ))}
    </m.div>
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
  const colors = FLOOR_COLORS[(floor as FloorId)] || FLOOR_COLORS["?"];
  const isNew = isNewResident(profile.move_in_date);

  return (
    <Link
      href={`/profile/${profile.id}`}
      className="block group"
      aria-label={t("a11y.viewProfile", { name: profile.name })}
    >
      <article
        className={`flex items-center gap-5 p-4 sm:p-5 bg-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-slate-100 ${isCurrentUser ? "ring-2 ring-brand-500/20 border-brand-500" : ""
          }`}
      >
        <div className="relative shrink-0">
          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-slate-100 shadow-sm">
            <OptimizedAvatarImage
              src={profile.avatar_url}
              alt={profile.name}
              context="card"
              className="w-full h-full"
              fallback={getInitials(profile.name)}
              fallbackClassName="bg-slate-50 text-slate-300 text-lg font-semibold rounded-xl w-full h-full flex items-center justify-center"
            />
          </Avatar>
          {isCurrentUser && (
            <span className="absolute -top-1.5 -right-1.5 bg-brand-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase shadow-sm">
              {t("common.you")}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-base sm:text-lg text-slate-900 font-semibold tracking-tight truncate">
              {profile.nickname || profile.name}
            </h3>
            {profile.room_number && (
              <span
                className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}
              >
                {profile.room_number}
              </span>
            )}
            {isNew && !isMockProfile && (
              <span className="text-[10px] px-2 py-0.5 bg-brand-500 text-white rounded-full font-bold tracking-wider">
                NEW
              </span>
            )}
            {isTeaTimeParticipant && !isMockProfile && (
              <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg font-bold flex items-center gap-1 shadow-sm border border-amber-200/50">
                <TeaCupIcon />
              </span>
            )}
            {isMockProfile && (
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide truncate">
                {t("common.unregistered")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
            {profile.occupation && (
              <span className="bg-slate-50 px-2 py-0.5 rounded-md">{t(`profileOptions.occupation.${profile.occupation}` as Parameters<typeof t>[0])}</span>
            )}
            {profile.mbti && <span className="text-brand-500 font-semibold">{profile.mbti}</span>}
          </div>
        </div>

        <div className="text-slate-300 group-hover:text-brand-500 transition-colors shrink-0">
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
