"use client";

import { m } from "framer-motion";
import { UserPlus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/hooks/use-i18n";

interface TeaserOverlayProps {
   totalCount?: number;
}

export function TeaserOverlay({ totalCount }: TeaserOverlayProps) {
   const t = useI18n();

   return (
      <div className="relative pt-20 pb-10">
         {/* Background Gradient */}
         <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />

         <m.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="relative premium-surface rounded-[40px] p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xl shadow-brand-500/10"
         >
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6 text-brand-500">
               <UserPlus className="w-8 h-8" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
               {totalCount ? t("teaser.headingWithCount", { count: totalCount }) : t("teaser.heading")}
            </h3>

            <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
               {t("teaser.description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Link
                  href="/login"
                  className="h-12 px-8 rounded-full bg-brand-500 hover:bg-brand-700 text-white font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-brand-200"
               >
                  {t("teaser.ctaJoin")}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
               </Link>
               <Link
                  href="/login"
                  className="h-12 px-8 rounded-full bg-card border border-border text-foreground/80 hover:bg-muted font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center"
               >
                  {t("teaser.ctaLogin")}
               </Link>
            </div>

            <p className="mt-8 text-[11px] font-bold text-muted-foreground tracking-widest uppercase">
               {t("teaser.footer")}
            </p>
         </m.div>
      </div>
   );
}
