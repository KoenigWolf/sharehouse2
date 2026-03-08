"use client";

import { useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { updateMatchStatus } from "@/lib/tea-time/actions";
import { getInitials, formatDate } from "@/lib/utils";
import { Profile } from "@/domain/profile";
import { TeaTimeMatch } from "@/domain/tea-time";
import { useI18n, useLocale } from "@/hooks/use-i18n";

interface TeaTimeMatchCardProps {
  match: TeaTimeMatch & { partner: Profile | null };
}

export function TeaTimeMatchCard({ match }: TeaTimeMatchCardProps) {
  const [status, setStatus] = useState(match.status);
  const [isLoading, setIsLoading] = useState(false);
  const t = useI18n();
  const locale = useLocale();

  if (!match.partner) return null;

  const handleStatusUpdate = async (newStatus: "done" | "skipped") => {
    setIsLoading(true);
    const result = await updateMatchStatus(match.id, newStatus);
    if ("success" in result) {
      setStatus(newStatus);
    }
    setIsLoading(false);
  };

  const resolvedLocale = locale === "ja" ? "ja-JP" : "en-US";
  const dateOptions: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };

  // 過去のマッチ（完了・スキップ済み）
  if (status !== "scheduled") {
    return (
      <div className="bg-muted/80 p-3 border border-border rounded-xl">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 rounded-full border border-white shadow-sm">
            <OptimizedAvatarImage
              src={match.partner.avatar_url}
              context="card"
              alt={t("a11y.profilePhotoAlt", { name: match.partner.name })}
              fallback={getInitials(match.partner.name)}
              fallbackClassName="bg-card text-muted-foreground/70 text-[10px] font-bold"
            />
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-muted-foreground truncate">
              {match.partner.name}
            </p>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
            {formatDate(match.matched_at, dateOptions, resolvedLocale)}
            <span className="mx-1.5 opacity-30">·</span>
            {status === "done" ? t("teaTime.done") : t("teaTime.skipped")}
          </span>
        </div>
      </div>
    );
  }

  // アクティブなマッチ
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="premium-surface p-6 rounded-3xl border-border/50 relative overflow-hidden ring-1 ring-border/50"
    >
      <div className="flex items-center gap-5 mb-6">
        <Link href={`/profile/${match.partner.id}`}>
          <Avatar className="w-16 h-16 rounded-2xl border-2 border-border/50 shadow-md transition-transform hover:scale-105">
            <OptimizedAvatarImage
              src={match.partner.avatar_url}
              context="card"
              alt={t("a11y.profilePhotoAlt", { name: match.partner.name })}
              fallback={getInitials(match.partner.name)}
              fallbackClassName="bg-secondary text-muted-foreground/70 text-xl font-bold"
            />
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${match.partner.id}`}
            className="text-lg font-bold text-foreground hover:text-brand-500 transition-colors tracking-tight"
          >
            {match.partner.name}
          </Link>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              {match.partner.room_number &&
                `${match.partner.room_number}${t("profile.room")}`}
              {match.partner.room_number && <span className="mx-1.5 opacity-30">·</span>}
              {formatDate(match.matched_at, dateOptions, resolvedLocale)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          size="xl"
          onClick={() => handleStatusUpdate("done")}
          disabled={isLoading}
          className="flex-1 rounded-2xl shadow-lg shadow-brand-100 active:scale-[0.98] transition-transform font-bold tracking-tight"
        >
          {isLoading ? t("common.processing") : t("teaTime.hadTea")}
        </Button>
        <Button
          variant="secondary"
          size="xl"
          onClick={() => handleStatusUpdate("skipped")}
          disabled={isLoading}
          className="flex-1 rounded-2xl bg-secondary hover:bg-secondary text-foreground/80 font-bold tracking-tight active:scale-[0.98] transition-transform"
        >
          {t("teaTime.skip")}
        </Button>
      </div>
    </m.div>
  );
}
