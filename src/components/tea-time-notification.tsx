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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href="/tea-time" className="block group">
        <div className="bg-white border border-[#dddfd9] rounded-lg p-4 sm:p-5 hover:border-[#272a26] transition-colors">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shrink-0">
              <OptimizedAvatarImage
                src={match.partner.avatar_url}
                context="card"
                alt={t("a11y.profilePhotoAlt", { name: match.partner.name })}
                fallback={getInitials(match.partner.name)}
                fallbackClassName="text-sm bg-[#eceee9] rounded-full"
              />
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#959892] tracking-wide">
                {t("teaTime.matchNotificationTitle")}
              </p>
              <p className="text-sm sm:text-base text-[#272a26] mt-1 truncate">
                {match.partner.name}
                <span className="text-[#636861]">{t("teaTime.nameSuffix")}</span>
              </p>
              <p className="text-xs text-[#959892] mt-1">
                {t("teaTime.matchPrompt")}
              </p>
            </div>

            <div className="text-[#bdc0ba] group-hover:text-[#959892] transition-colors shrink-0">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
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
