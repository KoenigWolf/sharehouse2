"use client";

import { memo } from "react";
import Link from "next/link";
import { useI18n } from "@/hooks/use-i18n";
import type { Translator } from "@/lib/i18n";

type FooterVariant = "default" | "minimal";

interface FooterProps {
  variant?: FooterVariant;
}

const NAV_LINKS: { href: string; labelKey: Parameters<Translator>[0] }[] = [
  { href: "/", labelKey: "nav.home" },
  { href: "/room-photos", labelKey: "nav.gallery" },
  { href: "/info", labelKey: "nav.info" },
  { href: "/floor-plan", labelKey: "nav.floorPlan" },
];

export const Footer = memo(function Footer({ variant = "default" }: FooterProps) {
  const t = useI18n();

  if (variant === "minimal") {
    return (
      <footer className="hidden sm:block py-10 mt-auto border-t border-slate-100">
        <p className="text-sm text-slate-400 text-center tracking-tight">
          &copy; {new Date().getFullYear()} ShareHouse. All rights reserved.
        </p>
      </footer>
    );
  }

  return (
    <footer className="hidden sm:block mt-auto bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-12 sm:gap-6">
          <div className="max-w-xs">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Share<span className="text-emerald-600">House</span>
            </h2>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-12 sm:gap-16">
            <nav aria-label={t("footer.navigation")}>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Directory
              </h3>
              <ul className="flex flex-col gap-3">
                {NAV_LINKS.map(({ href, labelKey }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-slate-600 hover:text-emerald-600 transition-colors font-medium"
                    >
                      {t(labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Follow Us
              </h3>
              <div className="flex gap-4">
                {["Twitter", "Instagram"].map((sns) => (
                  <Link
                    key={sns}
                    href="#"
                    className="text-sm text-slate-600 hover:text-emerald-600 transition-colors font-medium"
                  >
                    {sns}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} ShareHouse. Built for modern communities.
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
