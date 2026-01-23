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
    if ("success" in result) {
      setStatus(newStatus);
    }
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  if (status !== "scheduled") {
    return (
      <div className="bg-[#f5f5f3] p-3 border border-[#e5e5e5]">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 rounded-none">
            <AvatarImage src={match.partner.avatar_url || undefined} />
            <AvatarFallback className="bg-white text-[#737373] text-xs rounded-none">
              {getInitials(match.partner.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#1a1a1a] truncate">{match.partner.name}</p>
          </div>
          <span className="text-[10px] text-[#a3a3a3]">
            {formatDate(match.matched_at)} · {status === "done" ? "完了" : "スキップ"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 border border-[#e5e5e5]">
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/profile/${match.partner.id}`}>
          <Avatar className="w-12 h-12 rounded-none">
            <AvatarImage src={match.partner.avatar_url || undefined} className="object-cover" />
            <AvatarFallback className="bg-[#f5f5f3] text-[#737373] rounded-none">
              {getInitials(match.partner.name)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${match.partner.id}`} className="text-sm text-[#1a1a1a] hover:text-[#b94a48]">
            {match.partner.name}
          </Link>
          <p className="text-[11px] text-[#a3a3a3]">
            {match.partner.room_number && `${match.partner.room_number}号室 · `}
            {formatDate(match.matched_at)}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => handleStatusUpdate("done")}
          disabled={isLoading}
          size="sm"
          className="flex-1 h-8 bg-[#b94a48] hover:bg-[#a13f3d] text-white rounded-none text-xs"
        >
          お茶した
        </Button>
        <Button
          onClick={() => handleStatusUpdate("skipped")}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex-1 h-8 border-[#e5e5e5] text-[#737373] hover:border-[#1a1a1a] rounded-none text-xs"
        >
          スキップ
        </Button>
      </div>
    </div>
  );
}
