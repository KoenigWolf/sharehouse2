"use client";

import { useState, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Layers,
  List,
  Search,
  X,
  ChevronRight,
  MessageCircle,
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
import { staggerContainer, staggerItem } from "@/lib/animation";
import { VibeUpdateModal } from "@/components/vibe-update-modal";
import { FloatingActionButton } from "@/components/ui/floating-action-button";

interface ResidentsGridProps {
  profiles: Profile[];
  currentUserId?: string;
  /** 未認証ユーザー向けにモザイクをかける */
  isBlurred?: boolean;
}

type ViewMode = "grid" | "floor" | "list";

const SEARCH_VISIBLE_THRESHOLD = 30;

export function ResidentsGrid({
  profiles,
  currentUserId,
  isBlurred = false,
}: ResidentsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isVibeModalOpen, setIsVibeModalOpen] = useState(false);
  const t = useI18n();
  const locale = useLocale();

  const viewModeOptions = useMemo(
    () => [
      { value: "grid" as const, label: t("residents.viewGrid"), icon: LayoutGrid },
      { value: "floor" as const, label: t("residents.viewFloor"), icon: Layers },
      { value: "list" as const, label: t("residents.viewList"), icon: List },
    ],
    [t]
  );

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

  const filteredAndSortedProfiles = useMemo(() => {
    let result = [...profiles];

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
      const roomA = a.room_number || "999";
      const roomB = b.room_number || "999";
      return roomA.localeCompare(roomB, locale, { numeric: true });
    });

    return result;
  }, [profiles, debouncedSearchQuery, locale]);

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

  const totalCount = profiles.length;

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
    <m.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {currentUserId && !isBlurred && (
        <>
          <FloatingActionButton
            onClick={() => setIsVibeModalOpen(true)}
            icon={MessageCircle}
            label={t("bulletin.updateVibe")}
          />

          <VibeUpdateModal
            isOpen={isVibeModalOpen}
            onClose={() => setIsVibeModalOpen(false)}
            currentVibe={currentUserProfile?.vibe?.message}
            userProfile={currentUserProfile ? {
              name: currentUserProfile.name,
              nickname: currentUserProfile.nickname ?? null,
              avatar_url: currentUserProfile.avatar_url,
            } : undefined}
          />
        </>
      )}

      {!isBlurred && (
        <m.section variants={staggerItem} className="space-y-2">
          <div className="flex items-center justify-end gap-3">
            <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded-lg">
              {viewModeOptions.map((option) => {
                const isActive = viewMode === option.value;
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setViewMode(option.value)}
                    className={`w-9 h-9 flex items-center justify-center rounded-md transition-all ${isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                    title={option.label}
                    aria-label={option.label}
                    aria-pressed={isActive}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          </div>

          {totalCount >= SEARCH_VISIBLE_THRESHOLD && (
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="search"
                placeholder={t("residents.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-72 h-10 pl-10 pr-9 bg-muted/40 border border-border/40 rounded-full text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 focus:bg-background transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </m.section>
      )}

      <AnimatePresence mode="wait">
        {filteredAndSortedProfiles.length === 0 ? (
          <m.div
            key="empty"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="py-16 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 mb-6 rounded-2xl bg-muted/60 flex items-center justify-center">
              <Search size={28} className="text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {t("residents.noMatch")}
            </h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              {t("residents.tryDifferentSearch")}
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="h-10 px-5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              {t("residents.clearSearch")}
            </button>
          </m.div>
        ) : viewMode === "floor" && !isBlurred ? (
          <FloorView
            key="floor-view"
            groupedByFloor={groupedByFloor}
            currentUserId={currentUserId}
            floorStats={floorStats}
            t={t}
          />
        ) : viewMode === "list" && !isBlurred ? (
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
            isBlurred={isBlurred}
          />
        )}
      </AnimatePresence>
    </m.div>
  );
}

function GridView({
  profiles,
  currentUserId,
  isBlurred = false,
}: {
  profiles: Profile[];
  currentUserId?: string;
  isBlurred?: boolean;
}) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      {profiles.map((profile, index) => (
        <m.div
          key={profile.id}
          className="h-full"
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.35,
            delay: Math.min(index * 0.025, 0.25),
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <ResidentCard
            profile={profile}
            isCurrentUser={currentUserId ? profile.id === currentUserId : false}
            isBlurred={isBlurred}
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
  t,
}: {
  groupedByFloor: Record<string, Profile[]>;
  currentUserId?: string;
  floorStats: Record<string, { total: number; registered: number }>;
  t: Translator;
}) {
  const floorsOrder: FloorId[] = ["5F", "4F", "3F", "2F"];

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-10 sm:space-y-12"
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
            transition={{
              duration: 0.35,
              delay: floorIndex * 0.06,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4 pb-3 border-b border-border/40">
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-xl ${colors.bg} ${colors.border} border`}
              >
                <span className={`text-lg font-bold ${colors.text}`}>{floor}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground">
                  {t("residents.floorLabel", { floor: floor.replace("F", "") })}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {floorStat.registered}/{floorStat.total}
                  </span>
                  <div className="flex-1 max-w-32 h-1 bg-muted rounded-full overflow-hidden">
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(floorStat.registered / floorStat.total) * 100}%` }}
                      transition={{ duration: 0.6, delay: floorIndex * 0.08 + 0.1 }}
                      className={`h-full rounded-full ${colors.accent}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {profiles.map((profile, index) => (
                <m.div
                  key={profile.id}
                  className="h-full"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: index * 0.03,
                  }}
                >
                  <ResidentCard
                    profile={profile}
                    isCurrentUser={currentUserId ? profile.id === currentUserId : false}
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
  t,
}: {
  profiles: Profile[];
  currentUserId?: string;
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
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.2,
            delay: Math.min(index * 0.015, 0.12),
          }}
        >
          <ResidentListItem
            profile={profile}
            isCurrentUser={currentUserId ? profile.id === currentUserId : false}
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
  t,
}: {
  profile: Profile;
  isCurrentUser: boolean;
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
          flex items-center gap-3 sm:gap-4 p-3 sm:p-4
          bg-card rounded-xl border
          transition-all duration-200
          hover:shadow-md hover:-translate-y-0.5
          ${isCurrentUser
            ? "ring-2 ring-brand-500/20 border-brand-500/40"
            : "border-border/40 hover:border-border/60"
          }
        `}
      >
        <div className="relative shrink-0">
          <Avatar className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl border border-border/30 shadow-sm">
            <OptimizedAvatarImage
              src={profile.avatar_url}
              alt={profile.name}
              context="card"
              className="w-full h-full"
              fallback={getInitials(profile.name)}
              fallbackClassName="bg-muted text-muted-foreground text-sm font-semibold rounded-xl w-full h-full flex items-center justify-center"
            />
          </Avatar>
          {isCurrentUser && (
            <span className="absolute -top-1 -right-1 bg-foreground text-background text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase">
              {t("common.you")}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base text-foreground font-semibold truncate">
              {profile.nickname || profile.name}
            </h3>
            {profile.room_number && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${colors.bg} ${colors.text}`}>
                {profile.room_number}
              </span>
            )}
            {isNew && !isMockProfile && (
              <span className="text-[9px] px-1.5 py-0.5 bg-brand-500 text-white rounded-full font-bold">
                {t("common.new")}
              </span>
            )}
            {isMockProfile && (
              <span className="text-[9px] text-muted-foreground/60 font-medium uppercase">
                {t("common.unregistered")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            {profile.occupation && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                {t(`profileOptions.occupation.${profile.occupation}` as Parameters<typeof t>[0])}
              </span>
            )}
            {profile.mbti && (
              <span className="text-[11px] text-foreground/60 font-medium">{profile.mbti}</span>
            )}
          </div>
        </div>

        <div className="text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0">
          <ChevronRight size={18} strokeWidth={1.5} />
        </div>
      </article>
    </Link>
  );
}
