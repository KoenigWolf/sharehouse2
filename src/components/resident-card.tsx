"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/domain/profile";
import { getInitials } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { MessageCircle, Sparkles } from "lucide-react";

interface ResidentCardProps {
  profile: Profile;
  isCurrentUser?: boolean;
  floorAccent?: string;
  showTeaTime?: boolean;
  teaTimeEnabled?: boolean;
}

interface ResidenceDuration {
  months: number;
  isNew: boolean;
}

const NEW_RESIDENT_THRESHOLD_MONTHS = 3;

function calculateResidenceDuration(moveInDate: string | null | undefined): ResidenceDuration | null {
  if (!moveInDate) return null;

  const moveIn = new Date(moveInDate);
  if (Number.isNaN(moveIn.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - moveIn.getTime();
  const months = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30)));

  return {
    months,
    isNew: months <= NEW_RESIDENT_THRESHOLD_MONTHS,
  };
}

function isMockProfile(profileId: string): boolean {
  return profileId.startsWith("mock-");
}

function useResidentCardData(profile: Profile) {
  return useMemo(() => {
    const isMock = isMockProfile(profile.id);
    const residenceDuration = calculateResidenceDuration(profile.move_in_date);
    const isNewResident = residenceDuration?.isNew ?? false;

    const displayInterests = profile.interests?.slice(0, 3) ?? [];
    const remainingInterests = (profile.interests?.length ?? 0) - displayInterests.length;

    const displayName = profile.nickname || profile.name;

    return {
      isMock,
      residenceDuration,
      isNewResident,
      displayInterests,
      remainingInterests,
      displayName,
    };
  }, [profile]);
}

const FLOOR_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  "2F": { bg: "bg-rose-50", text: "text-rose-600", glow: "shadow-rose-200/50" },
  "3F": { bg: "bg-amber-50", text: "text-amber-600", glow: "shadow-amber-200/50" },
  "4F": { bg: "bg-sky-50", text: "text-sky-600", glow: "shadow-sky-200/50" },
  "5F": { bg: "bg-emerald-50", text: "text-emerald-600", glow: "shadow-emerald-200/50" },
  "?": { bg: "bg-slate-50", text: "text-slate-600", glow: "shadow-slate-200/50" },
};

export const ResidentCard = memo(function ResidentCard({
  profile,
  isCurrentUser = false,
  floorAccent,
}: ResidentCardProps) {
  const t = useI18n();

  const {
    isMock,
    isNewResident,
    displayInterests,
    remainingInterests,
    displayName,
  } = useResidentCardData(profile);

  const roomFloor = profile.room_number ? profile.room_number.charAt(0) + "F" : "?";
  const colors = FLOOR_COLORS[roomFloor] ?? FLOOR_COLORS["?"];

  return (
    <Link
      href={`/profile/${profile.id}`}
      className="block h-full group outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-2xl"
      aria-label={t("a11y.viewProfile", { name: profile.name })}
    >
      <m.article
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`
          relative h-full flex flex-col
          bg-card rounded-2xl
          border border-border/40
          shadow-lg shadow-black/[0.03]
          hover:shadow-xl hover:shadow-black/[0.08]
          hover:border-border/60
          transition-shadow duration-300
          overflow-hidden
          ${isCurrentUser ? "ring-2 ring-brand-500/30 border-brand-500/40" : ""}
        `}
      >
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-transparent pointer-events-none" />

        {/* Floor accent stripe */}
        {floorAccent && (
          <div className={`h-1 w-full ${floorAccent}`} />
        )}

        <div className="relative p-4 sm:p-5 flex flex-col h-full">
          {/* Avatar section - larger, centered for impact */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative">
              <Avatar className={`
                w-20 h-20 sm:w-24 sm:h-24 rounded-2xl
                shadow-lg ${colors.glow}
                border-2 border-white
                group-hover:scale-105 transition-transform duration-300
              `}>
                <OptimizedAvatarImage
                  src={profile.avatar_url}
                  alt={profile.name}
                  context="card"
                  className="object-cover"
                  fallback={getInitials(profile.name)}
                  fallbackClassName="bg-gradient-to-br from-muted to-muted/80 text-muted-foreground text-xl sm:text-2xl font-bold rounded-2xl w-full h-full flex items-center justify-center"
                />
              </Avatar>

              {/* Status badges on avatar */}
              {isCurrentUser && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-md border-2 border-white tracking-wide uppercase">
                  You
                </span>
              )}
              {isNewResident && !isMock && !isCurrentUser && (
                <span className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md border border-white/20">
                  <Sparkles size={10} />
                  New
                </span>
              )}
            </div>

            {/* Room badge */}
            {profile.room_number && (
              <span className={`
                mt-3 text-xs font-bold tracking-wide px-3 py-1 rounded-full
                ${colors.bg} ${colors.text}
              `}>
                {profile.room_number}
              </span>
            )}
          </div>

          {/* Name and info - centered */}
          <div className="flex-1 text-center">
            <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight group-hover:text-brand-600 transition-colors line-clamp-1">
              {displayName}
            </h3>

            {/* Occupation & MBTI */}
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
              {profile.occupation && (
                <span className="truncate max-w-[100px]">
                  {t(`profileOptions.occupation.${profile.occupation}` as Parameters<typeof t>[0])}
                </span>
              )}
              {profile.occupation && profile.mbti && (
                <span className="opacity-40">·</span>
              )}
              {profile.mbti && (
                <span className="font-semibold text-foreground/70">{profile.mbti}</span>
              )}
            </div>

            {/* Interest tags */}
            {displayInterests.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 mt-3">
                {displayInterests.map((interest, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/60 text-[10px] font-medium text-muted-foreground"
                  >
                    {interest}
                  </span>
                ))}
                {remainingInterests > 0 && (
                  <span className="text-[10px] text-muted-foreground/60 flex items-center px-1">
                    +{remainingInterests}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Vibe section */}
          {profile.vibe?.message && (
            <div className="mt-4 pt-3 border-t border-dashed border-border/50">
              <div className="flex gap-2 items-start">
                <div className="mt-0.5 p-1 rounded-full bg-brand-50 text-brand-500 shrink-0">
                  <MessageCircle size={10} strokeWidth={2.5} />
                </div>
                <p className="text-[11px] text-foreground/70 line-clamp-2 leading-relaxed italic">
                  &ldquo;{profile.vibe.message}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Mock profile indicator */}
          {isMock && (
            <div className="mt-auto pt-3">
              <span className="block text-center text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">
                {t("common.unregistered")}
              </span>
            </div>
          )}
        </div>
      </m.article>
    </Link>
  );
});

ResidentCard.displayName = "ResidentCard";
