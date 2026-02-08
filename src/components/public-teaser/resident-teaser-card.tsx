"use client";

import { memo } from "react";
import { BlurredImage } from "./blurred-image";
import { MaskedText } from "./masked-text";
import { useI18n } from "@/hooks/use-i18n";
import type { TranslationKey } from "@/lib/i18n";
import type { PublicProfileTeaser } from "@/lib/residents/queries";

/** 動的な profileOptions キーを TranslationKey に変換する */
function profileOptionKey(
  category: "ageRange" | "industry",
  value: string,
): TranslationKey {
  return `profileOptions.${category}.${value}` as TranslationKey;
}

interface ResidentTeaserCardProps {
  profile: PublicProfileTeaser;
}

export const ResidentTeaserCard = memo(function ResidentTeaserCard({
  profile,
}: ResidentTeaserCardProps) {
  const t = useI18n();

  return (
    <div className="block select-none">
      <article className="h-full premium-surface rounded-3xl transition-all duration-500 relative overflow-hidden flex flex-col">
        <div className="aspect-[4/5] bg-muted relative overflow-hidden">
          <BlurredImage
            userId={profile.id}
            className="w-full h-full"
          />

          <div className="absolute top-4 left-4">
            {profile.age_range && (
              <span className="glass px-3 py-1 rounded-full text-[10px] font-bold text-foreground/90 tracking-wider">
                {t(profileOptionKey("ageRange", profile.age_range))}
              </span>
            )}
          </div>
        </div>

        <div className="p-5 bg-card flex flex-col h-[140px] sm:h-[160px]">
          <div className="flex items-center justify-between mb-2">
            <MaskedText
              text={profile.masked_nickname || profile.masked_name}
              className="text-lg text-foreground"
            />
          </div>

          {profile.industry && (
            <p className="text-xs font-medium text-muted-foreground mb-4">
              {t(profileOptionKey("industry", profile.industry))}
            </p>
          )}

          <div className="flex-1" aria-hidden="true" />

          {profile.masked_bio && (
            <div className="relative mt-2 shrink-0">
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 blur-[2px] select-none">
                {profile.masked_bio}...
              </p>
              <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
            </div>
          )}
        </div>
      </article>
    </div>
  );
});

ResidentTeaserCard.displayName = "ResidentTeaserCard";
