"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, OptimizedAvatarImage } from "@/components/ui/avatar";
import { updateMatchStatus } from "@/lib/tea-time/actions";
import { getInitials } from "@/lib/utils";
import { Profile } from "@/domain/profile";
import { TeaTimeMatch } from "@/domain/tea-time";
import { useI18n } from "@/hooks/use-i18n";
import { normalizeLocale } from "@/lib/i18n";

interface TeaTimeMatchCardProps {
  match: TeaTimeMatch & { partner: Profile | null };
}

export function TeaTimeMatchCard({ match }: TeaTimeMatchCardProps) {
  const [status, setStatus] = useState(match.status);
  const [isLoading, setIsLoading] = useState(false);
  const t = useI18n();
  const locale = normalizeLocale(
    typeof document !== "undefined"
      ? document.documentElement.lang || navigator.language
      : undefined
  );

  if (!match.partner) return null;

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
    const resolvedLocale = locale === "ja" ? "ja-JP" : "en-US";
    return date.toLocaleDateString(resolvedLocale, {
      month: "short",
      day: "numeric",
    });
  };

  // 過去のマッチ（完了・スキップ済み）
  if (status !== "scheduled") {
    return (
      <div className="bg-[#f5f5f3] p-3 border border-[#e5e5e5]">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 rounded-none">
            <OptimizedAvatarImage
              src={match.partner.avatar_url}
              context="card"
              alt={t("a11y.profilePhotoAlt", { name: match.partner.name })}
            />
            <AvatarFallback className="bg-white text-[#a3a3a3] text-xs rounded-none">
              {getInitials(match.partner.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#737373] truncate">
              {match.partner.name}
            </p>
          </div>
          <span className="text-[10px] text-[#a3a3a3]">
            {formatDate(match.matched_at)}
            <span className="mx-1">·</span>
            {status === "done" ? t("teaTime.done") : t("teaTime.skipped")}
          </span>
        </div>
      </div>
    );
  }

  // アクティブなマッチ
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-4 border border-[#e5e5e5]"
    >
      <div className="flex items-center gap-4 mb-4">
        <Link href={`/profile/${match.partner.id}`}>
          <Avatar className="w-14 h-14 rounded-none">
            <OptimizedAvatarImage
              src={match.partner.avatar_url}
              context="card"
              alt={t("a11y.profilePhotoAlt", { name: match.partner.name })}
            />
            <AvatarFallback className="bg-[#f5f5f3] text-[#a3a3a3] text-lg rounded-none">
              {getInitials(match.partner.name)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${match.partner.id}`}
            className="text-sm text-[#1a1a1a] hover:text-[#737373] transition-colors"
          >
            {match.partner.name}
          </Link>
          <p className="text-[10px] text-[#a3a3a3] mt-1">
            {match.partner.room_number &&
              `${match.partner.room_number}${t("profile.room")}`}
            {match.partner.room_number && <span className="mx-1">·</span>}
            {formatDate(match.matched_at)}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleStatusUpdate("done")}
          disabled={isLoading}
          className="flex-1 h-10 bg-[#1a1a1a] text-white text-xs tracking-wide hover:bg-[#333] disabled:bg-[#a3a3a3] disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? t("common.processing") : t("teaTime.hadTea")}
        </button>
        <button
          onClick={() => handleStatusUpdate("skipped")}
          disabled={isLoading}
          className="flex-1 h-10 border border-[#e5e5e5] text-[#737373] text-xs tracking-wide hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t("teaTime.skip")}
        </button>
      </div>
    </motion.div>
  );
}
