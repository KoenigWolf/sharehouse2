import { memo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile } from "@/types/profile";
import { getInitials } from "@/lib/utils";
import { PROFILE } from "@/lib/constants/config";
import { t } from "@/lib/i18n";

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
  const displayInterests = profile.interests?.slice(0, PROFILE.maxInterestsDisplay.card) || [];

  return (
    <Link
      href={`/profile/${profile.id}`}
      aria-label={`${profile.name}さんのプロフィールを見る`}
    >
      <article
        className={`bg-white border transition-colors cursor-pointer relative group ${
          isCurrentUser
            ? "border-[#b94a48] hover:border-[#a13f3d]"
            : isMockProfile
            ? "border-dashed border-[#d4d4d4] hover:border-[#a3a3a3]"
            : "border-[#e5e5e5] hover:border-[#b94a48]"
        }`}
      >
        {/* Current user badge */}
        {isCurrentUser && (
          <span
            className="absolute top-0 right-0 z-10 bg-[#b94a48] text-white text-[10px] px-2 py-0.5 tracking-wide"
            aria-label={t("common.you")}
          >
            {t("common.you")}
          </span>
        )}

        {/* Unregistered badge */}
        {isMockProfile && !isCurrentUser && (
          <span
            className="absolute top-0 left-0 z-10 bg-[#e5e5e5] text-[#737373] text-[10px] px-2 py-0.5 tracking-wide"
            aria-label={t("common.unregistered")}
          >
            {t("common.unregistered")}
          </span>
        )}

        {/* Avatar section */}
        <div className="aspect-square bg-[#f5f5f3] flex items-center justify-center overflow-hidden">
          <Avatar className="w-full h-full rounded-none">
            <AvatarImage
              src={profile.avatar_url || undefined}
              alt={`${profile.name}のプロフィール写真`}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
            <AvatarFallback
              className="bg-[#f5f5f3] text-[#a3a3a3] text-3xl rounded-none w-full h-full"
              aria-label={`${profile.name}のイニシャル`}
            >
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info section */}
        <div className="p-2 sm:p-4">
          <div className="flex items-baseline justify-between gap-1 sm:gap-2">
            <h3 className="text-sm sm:text-base text-[#1a1a1a] tracking-wide truncate">
              {profile.name}
            </h3>
            {profile.room_number && (
              <span className="text-[10px] sm:text-xs text-[#a3a3a3] shrink-0">
                {profile.room_number}
              </span>
            )}
          </div>

          {displayInterests.length > 0 && (
            <ul
              className="flex flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-3"
              aria-label="趣味・関心"
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
