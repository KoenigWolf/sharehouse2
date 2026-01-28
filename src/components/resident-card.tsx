"use client";

import { memo } from "react";
import Link from "next/link";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { Profile } from "@/domain/profile";
import { getInitials } from "@/lib/utils";
import { PROFILE } from "@/lib/constants/config";
import { useI18n } from "@/hooks/use-i18n";

interface ResidentCardProps {
  profile: Profile;
  isCurrentUser?: boolean;
  floorAccent?: string;
}

/**
 * Resident card component displaying profile preview
 * Optimized for mobile touch interactions
 */
export const ResidentCard = memo(function ResidentCard({
  profile,
  isCurrentUser = false,
  floorAccent,
}: ResidentCardProps) {
  const isMockProfile = profile.id.startsWith("mock-");
  const t = useI18n();
  const displayInterests =
    profile.interests?.slice(0, PROFILE.maxInterestsDisplay.card) || [];

  // 職業の表示テキストを取得
  const occupationKey = profile.occupation
    ? (`profileOptions.occupation.${profile.occupation}` as Parameters<typeof t>[0])
    : null;
  const occupationLabel = occupationKey ? t(occupationKey) : null;

  return (
    <Link
      href={`/profile/${profile.id}`}
      aria-label={t("a11y.viewProfile", { name: profile.name })}
      className="block group select-none"
    >
      <article
        className={`bg-white border transition-all duration-200 active:scale-[0.98] active:opacity-95 ${
          isCurrentUser
            ? "border-[#1a1a1a]"
            : isMockProfile
            ? "border-dashed border-[#d4d4d4] hover:border-[#a3a3a3]"
            : "border-[#e5e5e5] hover:border-[#1a1a1a]"
        }`}
        style={floorAccent && !isCurrentUser && !isMockProfile ? { borderBottomColor: floorAccent, borderBottomWidth: "2px" } : undefined}
      >
        {/* Avatar section */}
        <div className="aspect-square bg-[#f5f5f3] relative overflow-hidden">
          <Avatar className="w-full h-full rounded-none">
            <OptimizedAvatarImage
              src={profile.avatar_url}
              alt={t("a11y.profilePhotoAlt", { name: profile.name })}
              context="card"
              className="w-full h-full group-hover:scale-[1.02] transition-transform duration-300"
              fallback={getInitials(profile.name)}
              fallbackClassName="bg-[#f5f5f3] text-[#a3a3a3] text-3xl sm:text-4xl rounded-none w-full h-full flex items-center justify-center"
              fallbackAriaLabel={t("a11y.profileInitials", { name: profile.name })}
            />
          </Avatar>

          {/* Badges */}
          {isCurrentUser && (
            <span className="absolute top-2 right-2 bg-[#1a1a1a] text-white text-[10px] sm:text-[11px] px-2 py-1 tracking-wide">
              {t("common.you")}
            </span>
          )}
          {isMockProfile && !isCurrentUser && (
            <span className="absolute top-2 left-2 bg-[#f5f5f3] text-[#a3a3a3] text-[10px] sm:text-[11px] px-2 py-1 tracking-wide">
              {t("common.unregistered")}
            </span>
          )}

          {/* MBTI badge */}
          {profile.mbti && !isMockProfile && (
            <span className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-[#737373] text-[10px] sm:text-[11px] px-1.5 py-0.5 tracking-wide">
              {profile.mbti}
            </span>
          )}
        </div>

        {/* Info section */}
        <div className="p-3 sm:p-4 min-h-[72px] sm:min-h-[84px]">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm sm:text-base text-[#1a1a1a] tracking-wide truncate font-normal">
              {profile.name}
            </h3>
            {profile.room_number && (
              <span className="text-[10px] sm:text-[11px] text-[#a3a3a3] shrink-0">
                {profile.room_number}
              </span>
            )}
          </div>

          {/* 職業・業界 */}
          {(occupationLabel || profile.industry) && !isMockProfile && (
            <p className="text-[10px] sm:text-[11px] text-[#737373] mt-1 truncate">
              {occupationLabel}
              {occupationLabel && profile.industry && " · "}
              {profile.industry && (
                <span className="text-[#a3a3a3]">
                  {t(`profileOptions.industry.${profile.industry}` as Parameters<typeof t>[0])}
                </span>
              )}
            </p>
          )}

          {displayInterests.length > 0 && (
            <ul
              className="flex flex-wrap gap-1 sm:gap-1.5 mt-2 overflow-hidden max-h-[26px] sm:max-h-[28px]"
              aria-label={t("a11y.interestsList")}
            >
              {displayInterests.map((interest, i) => (
                <li
                  key={i}
                  className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 bg-[#f5f5f3] text-[#737373]"
                >
                  {interest}
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>
    </Link>
  );
});
