"use client";

import { m } from "framer-motion";
import { useI18n } from "@/hooks/use-i18n";
import { ResidentTeaserCard } from "./resident-teaser-card";
import { TeaserOverlay } from "./teaser-overlay";
import type { PublicProfileTeaser } from "@/lib/residents/queries";

interface PublicTeaserGridProps {
  profiles: PublicProfileTeaser[];
}

export function PublicTeaserGrid({ profiles }: PublicTeaserGridProps) {
  const t = useI18n();

  if (profiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{t("residents.noResidents")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      <div>
        <h2 className="text-lg sm:text-xl text-foreground tracking-wide font-light">
          {t("residents.title")}
        </h2>
        <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
          {t("residents.countLabel", { count: profiles.length })}
        </p>
      </div>

      <div className="space-y-12">
        <div className="relative max-h-[700px] overflow-hidden">
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8"
          >
            {profiles.map((profile, index) => (
              <m.div
                key={profile.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(index * 0.04, 0.4),
                  ease: [0.23, 1, 0.32, 1],
                }}
              >
                <ResidentTeaserCard profile={profile} />
              </m.div>
            ))}
          </m.div>

          <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-10" />
        </div>

        <div className="-mt-40 relative z-20">
          <TeaserOverlay totalCount={profiles.length} />
        </div>
      </div>
    </div>
  );
}
