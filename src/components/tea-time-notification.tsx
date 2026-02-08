"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { Profile } from "@/domain/profile";
import { TeaTimeMatch } from "@/domain/tea-time";
import { useI18n } from "@/hooks/use-i18n";
import { getInitials } from "@/lib/utils";

interface TeaTimeNotificationProps {
  match: TeaTimeMatch & { partner: Profile | null };
}

export function TeaTimeNotification({ match }: TeaTimeNotificationProps) {
  const t = useI18n();
  if (!match.partner) return null;

  return (
    <m.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <Link href="/tea-time" className="block group">
        <div className="premium-surface p-4 sm:p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 bg-linear-to-br from-brand-500/5 to-brand-500/5" />

          <div className="relative flex items-center gap-6">
            <Avatar className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-white shadow-sm shrink-0">
              <OptimizedAvatarImage
                src={match.partner.avatar_url}
                context="card"
                alt={t("a11y.profilePhotoAlt", { name: match.partner.name })}
                fallback={getInitials(match.partner.name)}
                fallbackClassName="text-lg bg-muted text-muted-foreground/70 rounded-2xl font-semibold"
              />
            </Avatar>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-brand-500 font-bold uppercase tracking-wider bg-brand-50 px-2 py-0.5 rounded-full">
                {t("teaTime.matchNotificationTitle")}
              </span>
              <p className="text-lg sm:text-xl text-foreground mt-1 truncate font-semibold tracking-tight">
                {match.partner.name}
                <span className="text-muted-foreground ml-1 font-normal">{t("teaTime.nameSuffix")}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("teaTime.matchPrompt")}
              </p>
            </div>

            <div className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground/70 group-hover:text-brand-500 group-hover:bg-brand-50 transition-all shrink-0">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </m.div>
  );
}
