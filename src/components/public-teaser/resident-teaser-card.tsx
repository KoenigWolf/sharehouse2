"use client";

import { memo } from "react";
import Link from "next/link";
import { BlurredImage } from "./blurred-image";
import { MaskedText } from "./masked-text";
import { useI18n } from "@/hooks/use-i18n";
import type { PublicProfileTeaser } from "@/lib/residents/queries";

interface ResidentTeaserCardProps {
   profile: PublicProfileTeaser;
}

export const ResidentTeaserCard = memo(function ResidentTeaserCard({
   profile,
}: ResidentTeaserCardProps) {
   const t = useI18n();

   return (
      <Link
         href="/login"
         className="block group select-none"
      >
         <article className="premium-surface rounded-3xl transition-all duration-500 relative overflow-hidden group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-brand-500/10">
            <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden">
               <BlurredImage
                  src={profile.avatar_url}
                  alt="Resident"
                  className="w-full h-full"
                  isLocked={true}
               />

               <div className="absolute top-4 left-4">
                  {profile.age_range && (
                     <span className="glass px-3 py-1 rounded-full text-[10px] font-bold text-slate-700 tracking-wider">
                        {t(`profileOptions.ageRange.${profile.age_range}` as any)}
                     </span>
                  )}
               </div>
            </div>

            <div className="p-5 bg-white">
               <div className="flex items-center justify-between mb-2">
                  <MaskedText
                     text={profile.nickname || profile.masked_name}
                     className="text-lg text-slate-900"
                  />
               </div>

               {profile.industry && (
                  <p className="text-xs font-medium text-slate-400 mb-4">
                     {t(`profileOptions.industry.${profile.industry}` as any)}
                  </p>
               )}

               {profile.masked_bio && (
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                     {profile.masked_bio}...
                  </p>
               )}

               <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-brand-600 tracking-widest uppercase">
                     {t("common.viewProfile" as any)?.replace("{{name}}", "") || "View Profile"}
                  </span>
               </div>
            </div>
         </article>
      </Link>
   );
});

ResidentTeaserCard.displayName = "ResidentTeaserCard";
