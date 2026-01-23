"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { updateMatchStatus } from "@/lib/tea-time/actions";
import { Profile } from "@/types/profile";
import { TeaTimeMatch } from "@/types/tea-time";

interface TeaTimeMatchCardProps {
  match: TeaTimeMatch & { partner: Profile | null };
}

export function TeaTimeMatchCard({ match }: TeaTimeMatchCardProps) {
  const [status, setStatus] = useState(match.status);
  const [isLoading, setIsLoading] = useState(false);

  if (!match.partner) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleStatusUpdate = async (newStatus: "done" | "skipped") => {
    setIsLoading(true);
    const result = await updateMatchStatus(match.id, newStatus);
    if (!result.error) {
      setStatus(newStatus);
    }
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
    });
  };

  if (status !== "scheduled") {
    return (
      <div className="bg-[#f5f5f3] p-4 border border-[#e5e5e5]">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 rounded-none">
            <AvatarImage src={match.partner.avatar_url || undefined} />
            <AvatarFallback className="bg-white text-[#737373] text-sm rounded-none">
              {getInitials(match.partner.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm text-[#1a1a1a]">{match.partner.name}</p>
            <p className="text-xs text-[#737373]">
              {formatDate(match.matched_at)} -{" "}
              {status === "done" ? "完了" : "スキップ"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 border border-[#e5e5e5]">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">☕</span>
        <span className="text-sm text-[#b94a48] tracking-wide">
          新しいマッチ
        </span>
        <span className="text-xs text-[#737373] ml-auto">
          {formatDate(match.matched_at)}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#e5e5e5]">
        <Link href={`/profile/${match.partner.id}`}>
          <Avatar className="w-16 h-16 rounded-none">
            <AvatarImage
              src={match.partner.avatar_url || undefined}
              className="object-cover"
            />
            <AvatarFallback className="bg-[#f5f5f3] text-[#737373] text-lg rounded-none">
              {getInitials(match.partner.name)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <Link
            href={`/profile/${match.partner.id}`}
            className="text-[#1a1a1a] hover:text-[#b94a48] transition-colors tracking-wide"
          >
            {match.partner.name}
          </Link>
          {match.partner.room_number && (
            <p className="text-sm text-[#737373]">
              {match.partner.room_number}号室
            </p>
          )}
          {match.partner.bio && (
            <p className="text-sm text-[#737373] mt-1 line-clamp-1">
              {match.partner.bio}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => handleStatusUpdate("done")}
          disabled={isLoading}
          className="flex-1 h-10 bg-[#b94a48] hover:bg-[#a13f3d] text-white rounded-none"
        >
          お茶した
        </Button>
        <Button
          onClick={() => handleStatusUpdate("skipped")}
          disabled={isLoading}
          variant="outline"
          className="flex-1 h-10 border-[#e5e5e5] text-[#737373] hover:border-[#1a1a1a] hover:text-[#1a1a1a] rounded-none"
        >
          スキップ
        </Button>
      </div>
    </div>
  );
}
