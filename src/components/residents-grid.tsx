"use client";

import { useState, useMemo, useCallback } from "react";
import { m, motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Layers,
  List,
  Search,
  X,
  ChevronRight,
  Coffee,
} from "lucide-react";
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
import { ICON_STROKE, ICON_GAP } from "@/lib/constants/icons";

interface ResidentsGridProps {
  profiles: Profile[];
  currentUserId: string;
  teaTimeParticipants?: string[];
}

type SortOption = "name" | "room_number" | "move_in_date";
type ViewMode = "grid" | "floor" | "list";
type FloorFilter = "all" | "2F" | "3F" | "4F" | "5F";

const SEARCH_VISIBLE_THRESHOLD = 30;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

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
      { value: "grid" as const, label: t("residents.viewGrid"), icon: LayoutGrid },
      { value: "floor" as const, label: t("residents.viewFloor"), icon: Layers },
      { value: "list" as const, label: t("residents.viewList"), icon: List },
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
      <div className="flex-1 flex items-center justify-center py-20">
        <p className="text-muted-foreground text-sm">{t("residents.noResidents")}</p>
      </div>
    );
  }

  return (
    // Golden ratio spacing: space-y-10 ≈ 40px (Fibonacci)
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          VIBE INPUT - Personal expression zone
      ═══════════════════════════════════════════════════════════════════ */}
      {currentUserId && (
        <m.div variants={itemVariants} className="max-w-2xl mx-auto w-full">
          <VibeInput
            currentVibe={currentUserProfile?.vibe?.message}
            isLoggedIn={!!currentUserId}
          />
        </m.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER & CONTROLS
          - Clear visual hierarchy
          - Grouped by function (title, view mode)
      ═══════════════════════════════════════════════════════════════════ */}
      <m.section variants={itemVariants} className="space-y-6">
        {/* Title row with view mode toggle */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl text-foreground tracking-tight font-semibold">
              {t("residents.title")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              {t("residents.countLabel", { count: displayCount })}
              {(searchQuery || floorFilter !== "all") &&
                ` ${t("residents.countOf", { total: totalCount })}`}
            </p>
          </div>

          {/* View mode toggle - touch target 44px+ */}
          <div className="flex gap-1 p-1 bg-muted/60 rounded-xl">
            {viewModeOptions.map((option) => {
              const isActive = viewMode === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setViewMode(option.value)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={option.label}
                  aria-label={option.label}
                  aria-pressed={isActive}
                >
                  <Icon size={18} strokeWidth={1.5} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            FLOOR FILTERS - Horizontal scroll with clear states
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="sticky top-[64px] z-30 -mx-4 px-4 py-4 sm:relative sm:top-0 sm:mx-0 sm:px-0 sm:py-0 bg-background/95 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {floors.map((floor, i) => {
              const isAll = floor === "all";
              const isActive = floorFilter === floor;
              const floorStat = isAll ? null : floorStats[floor];
              const colors = isAll ? null : FLOOR_COLORS[floor as keyof typeof FLOOR_COLORS];

              return (
                <m.button
                  key={floor}
                  type="button"
                  onClick={() => setFloorFilter(floor)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    shrink-0 h-12 px-5 sm:px-6 rounded-xl
                    flex items-center gap-2.5
                    text-sm font-semibold tracking-tight
                    transition-all duration-200
                    ${isActive
                      ? isAll
                        ? "bg-foreground text-background shadow-lg"
                        : `${colors?.bg} ${colors?.text} shadow-sm`
                      : "bg-muted/60 text-foreground/70 hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  <span>{isAll ? t("residents.filterAll") : floor}</span>
                  {floorStat && (
                    <span className={`text-xs tabular-nums ${isActive ? "opacity-70" : "text-muted-foreground"}`}>
                      {floorStat.registered}/{floorStat.total}
                    </span>
                  )}
                </m.button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SEARCH & SORT CONTROLS
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
          {/* Search field - only show when needed */}
          {totalCount >= SEARCH_VISIBLE_THRESHOLD && (
            <div className="relative">
              <Search size={18} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="search"
                placeholder={t("residents.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80 h-12 pl-12 pr-10 bg-muted/50 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 focus:bg-background transition-all duration-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {/* Sort options - underline style */}
          <div className="flex overflow-x-auto scrollbar-hide -mx-1 px-1 sm:mx-0 sm:px-0">
            {sortOptions.map((option) => {
              const isActive = sortBy === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSortChange(option.value)}
                  className="relative px-4 py-2.5 whitespace-nowrap shrink-0 group"
                >
                  <span className={`text-sm transition-colors ${
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}>
                    {option.label}
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="residents-sort-underline"
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-foreground rounded-full"
                      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </m.section>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTENT AREA
      ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {filteredAndSortedProfiles.length === 0 ? (
          <m.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-20 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 mb-8 rounded-2xl bg-muted/80 flex items-center justify-center">
              <Search size={32} className="text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t("residents.noMatch")}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {t("residents.tryDifferentSearch")}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFloorFilter("all");
              }}
              className="h-11 px-6 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              {t("residents.clearSearch")}
            </button>
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
    </m.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   GRID VIEW
   - Golden ratio grid gaps (gap-5 ≈ 20px, gap-6 ≈ 24px)
   - Responsive columns following content-aware breakpoints
═══════════════════════════════════════════════════════════════════════════ */
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6"
    >
      {profiles.map((profile, index) => (
        <m.div
          key={profile.id}
          className="h-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            delay: Math.min(index * 0.03, 0.3),
            ease: [0.25, 0.46, 0.45, 0.94],
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

/* ═══════════════════════════════════════════════════════════════════════════
   FLOOR VIEW
   - Clear section separation with golden ratio spacing (space-y-16 ≈ 64px)
   - Visual hierarchy: Floor label → Progress → Cards
═══════════════════════════════════════════════════════════════════════════ */
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
      className="space-y-14 sm:space-y-16"
    >
      {floorsOrder.map((floor, floorIndex) => {
        const profiles = groupedByFloor[floor] || [];
        const colors = FLOOR_COLORS[floor];
        const floorStat = floorStats[floor];

        if (profiles.length === 0) return null;

        return (
          <m.section
            key={floor}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: floorIndex * 0.08,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="space-y-6"
          >
            {/* Floor header with progress indicator */}
            <div className="flex items-center gap-5 pb-5 border-b border-border/50">
              <div
                className={`w-14 h-14 flex items-center justify-center rounded-2xl ${colors.bg} ${colors.border} border`}
              >
                <span className={`text-xl font-bold tracking-tight ${colors.text}`}>{floor}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground">
                  {t("residents.floorLabel", { floor: floor.replace("F", "") })}
                </h3>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {floorStat.registered}/{floorStat.total} {t("residents.registeredShort")}
                  </span>
                  <div className="flex-1 max-w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(floorStat.registered / floorStat.total) * 100}%` }}
                      transition={{
                        duration: 0.8,
                        ease: [0.25, 0.46, 0.45, 0.94],
                        delay: floorIndex * 0.1 + 0.2,
                      }}
                      className={`h-full rounded-full ${colors.accent.replace("text-", "bg-")}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6">
              {profiles.map((profile, index) => (
                <m.div
                  key={profile.id}
                  className="h-full"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.04,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
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

/* ═══════════════════════════════════════════════════════════════════════════
   LIST VIEW
   - Compact rows with clear touch targets
   - F-pattern info layout (avatar → name → details → arrow)
═══════════════════════════════════════════════════════════════════════════ */
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
          transition={{
            duration: 0.25,
            delay: Math.min(index * 0.02, 0.15),
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
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

/* ═══════════════════════════════════════════════════════════════════════════
   LIST ITEM
   - Touch target: full row (minimum 64px height)
   - Visual hierarchy: Avatar → Name/Room → Meta → Arrow
═══════════════════════════════════════════════════════════════════════════ */
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
        className={`
          flex items-center gap-4 p-4 sm:p-5
          bg-card rounded-xl border
          transition-all duration-200
          hover:shadow-md hover:-translate-y-0.5
          ${isCurrentUser
            ? "ring-2 ring-brand-500/20 border-brand-500"
            : "border-border/50 hover:border-border"
          }
        `}
      >
        {/* Avatar with badge */}
        <div className="relative shrink-0">
          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-border/50">
            <OptimizedAvatarImage
              src={profile.avatar_url}
              alt={profile.name}
              context="card"
              className="w-full h-full"
              fallback={getInitials(profile.name)}
              fallbackClassName="bg-muted text-muted-foreground text-base sm:text-lg font-semibold rounded-xl w-full h-full flex items-center justify-center"
            />
          </Avatar>
          {isCurrentUser && (
            <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase">
              {t("common.you")}
            </span>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base sm:text-lg text-foreground font-semibold tracking-tight truncate">
              {profile.nickname || profile.name}
            </h3>
            {profile.room_number && (
              <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${colors.bg} ${colors.text}`}>
                {profile.room_number}
              </span>
            )}
            {isNew && !isMockProfile && (
              <span className="text-[10px] px-2 py-0.5 bg-brand-500 text-white rounded-full font-bold tracking-wider">
                NEW
              </span>
            )}
            {isTeaTimeParticipant && !isMockProfile && (
              <span className={`text-[10px] px-2 py-0.5 bg-warning-bg text-warning rounded-lg font-bold flex items-center ${ICON_GAP.xs} border border-warning-border/50`}>
                <Coffee size={10} strokeWidth={ICON_STROKE.normal} />
              </span>
            )}
            {isMockProfile && (
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                {t("common.unregistered")}
              </span>
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-2.5 mt-1.5">
            {profile.occupation && (
              <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                {t(`profileOptions.occupation.${profile.occupation}` as Parameters<typeof t>[0])}
              </span>
            )}
            {profile.mbti && (
              <span className="text-xs text-brand-500 font-semibold">{profile.mbti}</span>
            )}
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="text-muted-foreground/50 group-hover:text-foreground transition-colors shrink-0">
          <ChevronRight size={20} strokeWidth={1.5} />
        </div>
      </article>
    </Link>
  );
}
