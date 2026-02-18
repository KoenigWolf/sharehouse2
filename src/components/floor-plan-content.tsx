"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import FocusTrap from "focus-trap-react";
import { X, User, Briefcase, Calendar } from "lucide-react";
import { Profile, ROOM_NUMBERS } from "@/domain/profile";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/hooks/use-i18n";
import { getInitials, formatDate, calculateResidenceDuration } from "@/lib/utils";
import { getFloorFromRoom, FLOOR_COLORS, type FloorId } from "@/lib/utils/residents";
import { staggerContainer, staggerItem } from "@/lib/animation";

interface FloorPlanContentProps {
  profiles: Profile[];
  currentUserId: string;
}

const FLOORS: FloorId[] = ["2F", "3F", "4F", "5F"];

function getRoomsForFloor(floor: FloorId): string[] {
  const floorDigit = floor[0];
  return ROOM_NUMBERS.filter((r) => r[0] === floorDigit);
}

function isMockProfile(profile: Profile): boolean {
  return profile.id.startsWith("mock-");
}

export function FloorPlanContent({ profiles, currentUserId }: FloorPlanContentProps) {
  const [activeFloor, setActiveFloor] = useState<FloorId>("5F");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const t = useI18n();

  const profileByRoom = useMemo(() => {
    const map = new Map<string, Profile>();
    for (const profile of profiles) {
      if (profile.room_number) {
        map.set(profile.room_number, profile);
      }
    }
    return map;
  }, [profiles]);

  const occupancyByFloor = useMemo(() => {
    const counts: Record<FloorId, number> = { "2F": 0, "3F": 0, "4F": 0, "5F": 0 };
    for (const profile of profiles) {
      if (profile.room_number && !isMockProfile(profile)) {
        const floor = getFloorFromRoom(profile.room_number) as FloorId;
        counts[floor]++;
      }
    }
    return counts;
  }, [profiles]);

  const handleClosePopup = useCallback(() => setSelectedRoom(null), []);

  useEffect(() => {
    if (!selectedRoom) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedRoom(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedRoom]);

  const rooms = getRoomsForFloor(activeFloor);
  const colors = FLOOR_COLORS[activeFloor];
  const selectedProfile = selectedRoom ? profileByRoom.get(selectedRoom) ?? null : null;

  return (
    <m.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <m.div
        variants={staggerItem}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
      >
        {FLOORS.slice().reverse().map((floor, i) => {
          const isActive = floor === activeFloor;
          const floorColors = FLOOR_COLORS[floor];
          const occupancy = occupancyByFloor[floor];

          return (
            <m.button
              key={floor}
              type="button"
              onClick={() => { setActiveFloor(floor); setSelectedRoom(null); }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
              className={`
                flex-1 min-w-[80px] h-20 flex flex-col items-center justify-center
                rounded-2xl transition-all duration-200
                ${isActive
                  ? `${floorColors.bg} ${floorColors.text} shadow-lg ring-2 ring-offset-2 ring-offset-background ${floorColors.ring}`
                  : "bg-muted/60 text-foreground/70 hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <span className="text-xl font-bold">{floor}</span>
              <span className={`text-xs font-medium mt-1 ${isActive ? "opacity-70" : "text-muted-foreground"}`}>
                {occupancy}/5
              </span>
            </m.button>
          );
        })}
      </m.div>

      <m.section variants={staggerItem} className="premium-surface rounded-2xl sm:rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${colors.bg} ${colors.text} border ${colors.border}`}>
            <span className="text-lg font-bold">{activeFloor}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {t("floorPlan.floor", { floor: activeFloor[0] })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("floorPlan.residentLayout")}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <m.div
            key={activeFloor}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="grid grid-cols-5 gap-3 sm:gap-4"
          >
            {rooms.map((roomNumber, index) => {
              const profile = profileByRoom.get(roomNumber);
              const isMock = profile ? isMockProfile(profile) : false;
              const isOccupied = !!profile && !isMock;
              const isCurrentUser = profile?.id === currentUserId;

              return (
                <m.button
                  key={roomNumber}
                  type="button"
                  onClick={() => setSelectedRoom(roomNumber)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    relative flex flex-col items-center p-3 sm:p-4 min-h-[100px] sm:min-h-[120px]
                    rounded-2xl transition-all duration-200
                    ${isOccupied
                      ? "bg-card border border-border shadow-sm hover:shadow-lg"
                      : "bg-muted/50 border border-dashed border-border/50 opacity-60 hover:opacity-100"
                    }
                  `}
                >
                  {isCurrentUser && (
                    <span className="absolute -top-2 -right-2 bg-foreground text-background text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10">
                      {t("common.you")}
                    </span>
                  )}

                  <div className="w-12 h-12 sm:w-14 sm:h-14 mb-3 relative">
                    {profile ? (
                      <Avatar className="w-full h-full rounded-xl border-2 border-border/50">
                        <OptimizedAvatarImage
                          src={profile.avatar_url}
                          alt={profile.nickname || profile.name}
                          context="card"
                          fallback={
                            <span className="text-sm font-semibold text-muted-foreground/70">
                              {getInitials(profile.nickname || profile.name)}
                            </span>
                          }
                          fallbackClassName="bg-muted"
                        />
                      </Avatar>
                    ) : (
                      <div className="w-full h-full rounded-xl bg-muted/50 flex items-center justify-center border border-dashed border-border/50">
                        <span className="text-[10px] font-medium text-muted-foreground/50">
                          {t("floorPlan.vacant")}
                        </span>
                      </div>
                    )}
                  </div>

                  <span className={`text-xs font-bold tracking-wide ${isOccupied ? "text-foreground" : "text-muted-foreground/60"}`}>
                    {roomNumber}
                  </span>

                  {profile && (
                    <span className={`text-[10px] truncate max-w-full mt-1 font-medium ${isMock ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
                      {profile.nickname || profile.name}
                    </span>
                  )}
                </m.button>
              );
            })}
          </m.div>
        </AnimatePresence>
      </m.section>

      <AnimatePresence>
        {selectedRoom && (
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              returnFocusOnDeactivate: true,
              escapeDeactivates: true,
              onDeactivate: handleClosePopup,
            }}
          >
            <div>
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
                onClick={handleClosePopup}
              />

              <m.div
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="fixed inset-x-4 bottom-8 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 z-50 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-sm"
                role="dialog"
                aria-modal="true"
                aria-label={selectedRoom}
              >
                <div className="bg-card border border-border/50 shadow-2xl rounded-3xl p-6 relative">
                  <button
                    type="button"
                    onClick={handleClosePopup}
                    className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label={t("floorPlan.closeDetail")}
                  >
                    <X size={20} />
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <span className={`text-sm font-bold px-3 py-1.5 rounded-xl ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {selectedRoom}
                    </span>
                    {selectedProfile && isMockProfile(selectedProfile) && (
                      <span className="text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-lg">
                        {t("residents.sampleData")}
                      </span>
                    )}
                  </div>

                  {selectedProfile ? (
                    <RoomDetailOccupied
                      profile={selectedProfile}
                      isCurrentUser={selectedProfile.id === currentUserId}
                    />
                  ) : (
                    <RoomDetailVacant />
                  )}
                </div>
              </m.div>
            </div>
          </FocusTrap>
        )}
      </AnimatePresence>
    </m.div>
  );
}

function RoomDetailOccupied({
  profile,
  isCurrentUser,
}: {
  profile: Profile;
  isCurrentUser: boolean;
}) {
  const t = useI18n();
  const displayName = profile.nickname || profile.name;
  const duration = calculateResidenceDuration(profile.move_in_date, t);
  const moveInFormatted = formatDate(profile.move_in_date);
  const isMock = isMockProfile(profile);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="w-16 h-16 rounded-2xl border border-border">
          <OptimizedAvatarImage
            src={profile.avatar_url}
            alt={displayName}
            context="card"
            fallback={
              <span className="text-lg font-semibold text-muted-foreground">
                {getInitials(displayName)}
              </span>
            }
            fallbackClassName="bg-muted"
          />
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-foreground truncate">
              {displayName}
            </p>
            {isCurrentUser && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-foreground text-background shrink-0">
                {t("common.you")}
              </span>
            )}
          </div>
          {duration && (
            <p className="text-sm text-muted-foreground mt-0.5">{duration}</p>
          )}
        </div>
      </div>

      {(moveInFormatted || profile.occupation) && (
        <div className="grid grid-cols-2 gap-3">
          {moveInFormatted && (
            <div className="bg-muted/50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <Calendar size={14} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {t("floorPlan.moveInDate")}
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground">{moveInFormatted}</span>
            </div>
          )}
          {profile.occupation && (
            <div className="bg-muted/50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <Briefcase size={14} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {t("floorPlan.occupation")}
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground truncate block">
                {t(`profileOptions.occupation.${profile.occupation}` as Parameters<typeof t>[0])}
              </span>
            </div>
          )}
        </div>
      )}

      {profile.bio && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 italic">
          &ldquo;{profile.bio}&rdquo;
        </p>
      )}

      {!isMock && (
        <Link
          href={`/profile/${profile.id}`}
          className="flex items-center justify-center gap-2 w-full h-12 bg-foreground text-background rounded-xl text-sm font-semibold hover:bg-foreground/90 transition-colors"
        >
          <User size={18} />
          {t("floorPlan.viewProfile")}
        </Link>
      )}
    </div>
  );
}

function RoomDetailVacant() {
  const t = useI18n();

  return (
    <div className="py-10 text-center">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-muted/50 border border-dashed border-border flex items-center justify-center">
        <span className="text-sm text-muted-foreground/50 font-medium">
          {t("floorPlan.vacant")}
        </span>
      </div>
      <p className="text-sm text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
        {t("floorPlan.vacantDescription")}
      </p>
    </div>
  );
}
