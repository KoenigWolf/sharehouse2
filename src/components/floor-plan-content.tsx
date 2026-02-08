"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import { Profile, ROOM_NUMBERS } from "@/domain/profile";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/hooks/use-i18n";
import { getInitials, formatDate, calculateResidenceDuration } from "@/lib/utils";
import { getFloorFromRoom, FLOOR_COLORS, type FloorId } from "@/lib/utils/residents";

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
    <div>
      <div className="flex gap-4 mb-10 overflow-x-auto pb-4 no-scrollbar">
        {FLOORS.slice().reverse().map((floor) => {
          const isActive = floor === activeFloor;
          const floorColors = FLOOR_COLORS[floor];

          return (
            <button
              key={floor}
              type="button"
              onClick={() => { setActiveFloor(floor); setSelectedRoom(null); }}
              className={`
                relative flex-1 min-w-[70px] py-4 text-sm font-bold tracking-tight
                transition-all duration-500 rounded-2xl overflow-hidden shadow-sm
                ${isActive
                  ? `${floorColors.bg} ${floorColors.text} shadow-xl shadow-brand-100 ring-4 ring-brand-500/10`
                  : "bg-white text-muted-foreground hover:bg-muted hover:text-foreground/80 border border-border"
                }
                active:scale-[0.96]
              `}
            >
              <span className="block text-xl">{floor}</span>
              <span className={`block text-[9px] uppercase font-black tracking-[0.15em] mt-1.5 ${isActive ? "opacity-70" : "opacity-40"}`}>
                {t("floorPlan.occupancy", { count: occupancyByFloor[floor] })}
              </span>
            </button>
          );
        })}
      </div>

      <div className="premium-surface rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-xl ${colors.bg} ${colors.text} shadow-sm border ${colors.border}`}
          >
            <span className="font-bold">{activeFloor}</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {t("floorPlan.floor", { floor: activeFloor[0] })}
            </h3>
            <p className="text-xs text-muted-foreground">{t("floorPlan.residentLayout")}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <m.div
            key={activeFloor}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="grid grid-cols-5 gap-3 sm:gap-4"
          >
            {rooms.map((roomNumber) => {
              const profile = profileByRoom.get(roomNumber);
              const isMock = profile ? isMockProfile(profile) : false;
              const isOccupied = !!profile && !isMock;
              const isCurrentUser = profile?.id === currentUserId;

              return (
                <button
                  key={roomNumber}
                  type="button"
                  onClick={() => setSelectedRoom(roomNumber)}
                  className={`
                    relative flex flex-col items-center p-3 sm:p-5 transition-all duration-500 rounded-2xl
                    ${isOccupied
                      ? "bg-white border border-border shadow-sm hover:shadow-xl hover:-translate-y-0.5 ring-1 ring-border/50"
                      : "bg-muted border border-dashed border-border hover:border-border opacity-60 hover:opacity-100"
                    }
                  `}
                >
                  {isCurrentUser && (
                    <span className="absolute -top-2 -right-2 bg-brand-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10 shadow-sm">
                      {t("common.you")}
                    </span>
                  )}

                  <div className="w-14 h-14 sm:w-16 sm:h-16 mb-4 relative">
                    {profile ? (
                      <Avatar className="w-full h-full rounded-2xl border-2 border-border/50 shadow-md">
                        <OptimizedAvatarImage
                          src={profile.avatar_url}
                          alt={profile.nickname || profile.name}
                          context="card"
                          fallback={
                            <span className="text-sm font-bold text-muted-foreground/70">
                              {getInitials(profile.nickname || profile.name)}
                            </span>
                          }
                          fallbackClassName="bg-secondary"
                        />
                      </Avatar>
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-white/50 flex items-center justify-center border-2 border-dashed border-border shadow-inner">
                        <span className="text-[10px] font-bold text-muted-foreground/70 tracking-wider">
                          {t("floorPlan.vacant")}
                        </span>
                      </div>
                    )}
                  </div>

                  <span className={`text-[11px] font-black tracking-[0.1em] ${isOccupied ? "text-foreground" : "text-muted-foreground/70"}`}>
                    {roomNumber}
                  </span>

                  {profile && (
                    <span className={`text-[10px] truncate max-w-full mt-1.5 font-bold ${isMock ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
                      {profile.nickname || profile.name}
                    </span>
                  )}
                </button>
              );
            })}
          </m.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedRoom && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
              onClick={handleClosePopup}
            />

            <m.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed inset-x-4 bottom-8 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 z-50 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-sm"
              role="dialog"
              aria-modal="true"
              aria-label={selectedRoom}
            >
              <div className="glass border border-white/20 shadow-2xl rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/40" />

                <div className="relative">
                  <button
                    type="button"
                    onClick={handleClosePopup}
                    className="absolute -top-1 -right-1 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full transition-all"
                    aria-label={t("floorPlan.closeDetail")}
                  >
                    <X size={20} strokeWidth={2} />
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {selectedRoom}
                    </span>
                    {selectedProfile && isMockProfile(selectedProfile) && (
                      <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full border border-border">
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
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
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
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="w-16 h-16 rounded-2xl border border-white shadow-md">
          <OptimizedAvatarImage
            src={profile.avatar_url}
            alt={displayName}
            context="card"
            fallback={
              <span className="text-lg text-muted-foreground/70 font-semibold">
                {getInitials(displayName)}
              </span>
            }
            fallbackClassName="bg-muted"
          />
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-foreground tracking-tight truncate">
              {displayName}
            </p>
            {isCurrentUser && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-500 text-white shadow-sm shrink-0`}>
                {t("common.you")}
              </span>
            )}
          </div>
          {duration && (
            <p className="text-sm text-muted-foreground mt-0.5 font-medium">{duration}</p>
          )}
        </div>
      </div>

      {(moveInFormatted || profile.occupation) && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {moveInFormatted && (
            <div className="bg-muted/50 p-3 rounded-xl border border-border">
              <span className="block text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-1">{t("floorPlan.moveInDate")}</span>
              <span className="text-xs font-semibold text-foreground/90">{moveInFormatted}</span>
            </div>
          )}
          {profile.occupation && (
            <div className="bg-muted/50 p-3 rounded-xl border border-border">
              <span className="block text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-1">{t("floorPlan.occupation")}</span>
              <span className="text-xs font-semibold text-foreground/90 truncate block">
                {t(`profileOptions.occupation.${profile.occupation}` as Parameters<typeof t>[0])}
              </span>
            </div>
          )}
        </div>
      )}

      {profile.bio && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3 font-medium italic">
          &ldquo;{profile.bio}&rdquo;
        </p>
      )}

      {!isMock && (
        <Link
          href={`/profile/${profile.id}`}
          className="block w-full text-center text-sm font-bold py-3.5 bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-100 hover:bg-brand-700 hover:shadow-brand-200 transition-all active:scale-[0.98]"
        >
          {t("floorPlan.viewProfile")}
        </Link>
      )}
    </div>
  );
}

function RoomDetailVacant() {
  const t = useI18n();

  return (
    <div className="py-8 text-center bg-muted/50 rounded-2xl border border-dashed border-border">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center">
        <span className="text-sm text-muted-foreground/70 font-bold tracking-tight">{t("floorPlan.vacant")}</span>
      </div>
      <p className="text-sm text-muted-foreground max-w-[240px] mx-auto font-medium">
        {t("floorPlan.vacantDescription")}
      </p>
    </div>
  );
}
