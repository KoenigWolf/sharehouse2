import { memo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile } from "@/types/profile";

interface ResidentCardProps {
  profile: Profile;
  isCurrentUser?: boolean;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const ResidentCard = memo(function ResidentCard({ profile, isCurrentUser = false }: ResidentCardProps) {
  const isMockProfile = profile.id.startsWith("mock-");

  return (
    <Link href={`/profile/${profile.id}`}>
      <div
        className={`bg-white border transition-colors cursor-pointer relative group ${
          isCurrentUser
            ? "border-[#b94a48] hover:border-[#a13f3d]"
            : isMockProfile
            ? "border-dashed border-[#d4d4d4] hover:border-[#a3a3a3]"
            : "border-[#e5e5e5] hover:border-[#b94a48]"
        }`}
      >
        {/* 自分バッジ */}
        {isCurrentUser && (
          <div className="absolute top-0 right-0 z-10 bg-[#b94a48] text-white text-[10px] px-2 py-0.5 tracking-wide">
            あなた
          </div>
        )}

        {/* 未登録バッジ */}
        {isMockProfile && !isCurrentUser && (
          <div className="absolute top-0 left-0 z-10 bg-[#e5e5e5] text-[#737373] text-[10px] px-2 py-0.5 tracking-wide">
            未登録
          </div>
        )}

        {/* アバター部分 */}
        <div className="aspect-square bg-[#f5f5f3] flex items-center justify-center overflow-hidden">
          <Avatar className="w-full h-full rounded-none">
            <AvatarImage
              src={profile.avatar_url || undefined}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
            <AvatarFallback className="bg-[#f5f5f3] text-[#a3a3a3] text-3xl rounded-none w-full h-full">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* 情報部分 */}
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

          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-3">
              {profile.interests.slice(0, 2).map((interest, i) => (
                <span
                  key={i}
                  className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 bg-[#f5f5f3] text-[#737373]"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
});
