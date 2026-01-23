"use client";

import { memo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile } from "@/domain/profile";
import { getInitials } from "@/lib/utils";
import { PROFILE } from "@/lib/constants/config";
import { useI18n } from "@/hooks/use-i18n";

interface ResidentCardProps {
  profile: Profile;
  isCurrentUser?: boolean;
}

/**
 * Resident card component displaying profile preview
 */
export const ResidentCard = memo(function ResidentCard({
  profile,
  isCurrentUser = false,
}: ResidentCardProps) {
  const isMockProfile = profile.id.startsWith("mock-");
  const t = useI18n();
  const displayInterests =
    profile.interests?.slice(0, PROFILE.maxInterestsDisplay.card) || [];

  return (
    <Link
      href={`/profile/${profile.id}`}
      aria-label={t("a11y.viewProfile", { name: profile.name })}
      className="block group"
    >
      <article
        className={`bg-white border transition-all duration-200 ${
          isCurrentUser
            ? "border-[#1a1a1a]"
            : isMockProfile
            ? "border-dashed border-[#d4d4d4] hover:border-[#a3a3a3]"
            : "border-[#e5e5e5] hover:border-[#1a1a1a]"
        }`}
      >
        {/* Avatar section */}
        <div className="aspect-square bg-[#f5f5f3] relative overflow-hidden">
          <Avatar className="w-full h-full rounded-none">
            <AvatarImage
              src={profile.avatar_url || undefined}
              alt={t("a11y.profilePhotoAlt", { name: profile.name })}
              className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-300"
            />
            <AvatarFallback
              className="bg-[#f5f5f3] text-[#a3a3a3] text-2xl sm:text-3xl rounded-none w-full h-full flex items-center justify-center"
              aria-label={t("a11y.profileInitials", { name: profile.name })}
            >
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>

          {/* Badges */}
          {isCurrentUser && (
            <span className="absolute top-2 right-2 bg-[#1a1a1a] text-white text-[10px] px-2 py-0.5 tracking-wide">
              {t("common.you")}
            </span>
          )}
          {isMockProfile && !isCurrentUser && (
            <span className="absolute top-2 left-2 bg-[#f5f5f3] text-[#a3a3a3] text-[10px] px-2 py-0.5 tracking-wide">
              {t("common.unregistered")}
            </span>
          )}
        </div>

        {/* Info section - fixed height */}
        <div className="p-3 sm:p-4 h-[72px] sm:h-[80px] overflow-hidden">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm text-[#1a1a1a] tracking-wide truncate">
              {profile.name}
            </h3>
            {profile.room_number && (
              <span className="text-[10px] text-[#a3a3a3] shrink-0">
                {profile.room_number}
              </span>
            )}
          </div>

          {displayInterests.length > 0 && (
            <ul
              className="flex flex-wrap gap-1.5 mt-2 overflow-hidden max-h-[28px]"
              aria-label={t("a11y.interestsList")}
            >
              {displayInterests.map((interest, i) => (
                <li
                  key={i}
                  className="text-[10px] px-2 py-0.5 bg-[#f5f5f3] text-[#737373]"
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
