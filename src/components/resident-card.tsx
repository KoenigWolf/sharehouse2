"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile } from "@/types/profile";

interface ResidentCardProps {
  profile: Profile;
  index: number;
  isCurrentUser?: boolean;
}

export function ResidentCard({ profile, isCurrentUser = false }: ResidentCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Link href={`/profile/${profile.id}`}>
      <div
        className={`bg-white border p-6 transition-colors cursor-pointer relative ${
          isCurrentUser
            ? "border-[#b94a48] hover:border-[#a13f3d]"
            : "border-[#e5e5e5] hover:border-[#b94a48]"
        }`}
      >
        {/* 自分バッジ */}
        {isCurrentUser && (
          <div className="absolute top-0 right-0 bg-[#b94a48] text-white text-[10px] px-2 py-0.5 tracking-wide">
            あなた
          </div>
        )}

        <div className="flex flex-col items-center text-center">
          <Avatar className="w-20 h-20 rounded-none">
            <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
            <AvatarFallback className="bg-[#f5f5f3] text-[#737373] text-lg rounded-none">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>

          <h3 className="mt-4 text-[#1a1a1a] tracking-wide">
            {profile.name}
          </h3>

          {profile.room_number && (
            <p className="text-xs text-[#737373] mt-1">
              {profile.room_number}号室
            </p>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {profile.interests.slice(0, 2).map((interest, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 bg-[#f5f5f3] text-[#737373]"
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
}
