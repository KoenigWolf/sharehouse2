"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile } from "@/types/profile";
import { TeaTimeMatch } from "@/types/tea-time";

interface TeaTimeNotificationProps {
  match: TeaTimeMatch & { partner: Profile | null };
}

export function TeaTimeNotification({ match }: TeaTimeNotificationProps) {
  if (!match.partner) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Link href="/tea-time">
      <div className="bg-white border border-[#e5e5e5] p-3 sm:p-4 hover:border-[#b94a48] transition-colors cursor-pointer">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#f5f5f3] flex items-center justify-center shrink-0">
            <span className="text-lg sm:text-xl">☕</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-[#b94a48] tracking-wide">
              新しいティータイムマッチ
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="w-5 h-5 rounded-none shrink-0">
                <AvatarImage src={match.partner.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-[#f5f5f3] rounded-none">
                  {getInitials(match.partner.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs sm:text-sm text-[#737373] truncate">
                {match.partner.name}さんとマッチ
              </span>
            </div>
          </div>
          <div className="text-[#737373] shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
