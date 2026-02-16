"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { m } from "framer-motion";
import type { Profile } from "@/domain/profile";
import { getInitials } from "@/lib/utils";
import { getOptimizedImageUrl, getResponsiveImageSizes } from "@/lib/utils/image";
import { useI18n } from "@/hooks/use-i18n";
import { Sparkles } from "lucide-react";

interface ResidentCardProps {
  profile: Profile;
  isCurrentUser?: boolean;
}

const NEW_RESIDENT_THRESHOLD_MONTHS = 3;

function calculateIsNewResident(moveInDate: string | null | undefined): boolean {
  if (!moveInDate) return false;
  const moveIn = new Date(moveInDate);
  if (Number.isNaN(moveIn.getTime())) return false;
  const diffMs = Date.now() - moveIn.getTime();
  const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  return months <= NEW_RESIDENT_THRESHOLD_MONTHS;
}

function isMockProfile(profileId: string): boolean {
  return profileId.startsWith("mock-");
}

export const ResidentCard = memo(function ResidentCard({
  profile,
  isCurrentUser = false,
}: ResidentCardProps) {
  const t = useI18n();

  const isMock = isMockProfile(profile.id);
  const isNewResident = useMemo(() => calculateIsNewResident(profile.move_in_date), [profile.move_in_date]);
  const displayName = profile.nickname || profile.name;
  const optimizedSrc = getOptimizedImageUrl(profile.avatar_url);

  return (
    <Link
      href={`/profile/${profile.id}`}
      className="block group outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-2xl"
      aria-label={t("a11y.viewProfile", { name: profile.name })}
    >
      <m.article
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`
          relative aspect-[3/4] rounded-2xl overflow-hidden
          bg-muted
          shadow-md shadow-black/10
          group-hover:shadow-xl group-hover:shadow-black/15
          transition-shadow duration-300
          ${isCurrentUser ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-background" : ""}
        `}
      >
        {/* Photo or Fallback */}
        <div className="absolute inset-0">
          {optimizedSrc ? (
            <Image
              src={optimizedSrc}
              alt={profile.name}
              fill
              className="object-cover"
              sizes={getResponsiveImageSizes("card")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
              <span className="text-muted-foreground text-3xl font-bold">
                {getInitials(profile.name)}
              </span>
            </div>
          )}
          {isMock && (
            <div className="absolute inset-0 bg-muted/80 flex items-center justify-center">
              <span className="text-muted-foreground/60 text-sm font-medium">
                {t("common.unregistered")}
              </span>
            </div>
          )}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
          {/* Room number */}
          {profile.room_number && (
            <span className="px-2 py-0.5 text-[11px] font-bold text-white bg-black/60 rounded-md shadow-sm">
              {profile.room_number}
            </span>
          )}

          {/* Status badges */}
          <div className="flex items-center gap-1.5">
            {isCurrentUser && (
              <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-brand-500 rounded-md uppercase tracking-wide">
                {t("residents.badgeYou")}
              </span>
            )}
            {isNewResident && !isMock && !isCurrentUser && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-md">
                <Sparkles size={10} />
                {t("residents.badgeNew")}
              </span>
            )}
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {/* Name */}
          <h3 className="text-base font-bold text-white leading-tight truncate drop-shadow-sm">
            {displayName}
          </h3>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1">
            {profile.mbti && (
              <span className="text-[11px] font-semibold text-white/90">
                {profile.mbti}
              </span>
            )}
            {profile.mbti && profile.occupation && (
              <span className="text-white/50">·</span>
            )}
            {profile.occupation && (
              <span className="text-[11px] text-white/80 truncate">
                {t(`profileOptions.occupation.${profile.occupation}` as Parameters<typeof t>[0])}
              </span>
            )}
          </div>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 overflow-hidden">
              {profile.interests.slice(0, 2).map((interest, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 text-[10px] font-medium text-white bg-black/40 rounded truncate max-w-[70px]"
                >
                  {interest}
                </span>
              ))}
              {profile.interests.length > 2 && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium text-white bg-black/40 rounded">
                  +{profile.interests.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </m.article>
    </Link>
  );
});

ResidentCard.displayName = "ResidentCard";
