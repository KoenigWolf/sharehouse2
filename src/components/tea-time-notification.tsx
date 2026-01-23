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
      <div className="bg-white border border-[#e5e5e5] p-4 hover:border-[#b94a48] transition-colors cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f5f5f3] flex items-center justify-center">
            <span className="text-xl">☕</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-[#b94a48] tracking-wide">
              新しいティータイムマッチ
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="w-5 h-5 rounded-none">
                <AvatarImage src={match.partner.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-[#f5f5f3] rounded-none">
                  {getInitials(match.partner.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-[#737373]">
                {match.partner.name}さんとマッチしました
              </span>
            </div>
          </div>
          <div className="text-[#737373]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
