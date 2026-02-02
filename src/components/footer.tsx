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
];

export const Footer = memo(function Footer({ variant = "default" }: FooterProps) {
  const t = useI18n();

  if (variant === "minimal") {
    return (
      <footer className="hidden sm:block py-6 mt-auto">
        <p className="text-xs text-[#a1a1aa] text-center tracking-wide">
          Share House Portal
        </p>
      </footer>
    );
  }

  return (
    <footer className="hidden sm:block mt-auto border-t border-[#e4e4e7]">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-sm text-[#18181b] tracking-wider">
              Share House Portal
            </span>
            <span className="text-[10px] text-[#d4d4d8]" aria-hidden="true">|</span>
            <span className="text-[10px] text-[#a1a1aa] tracking-wide">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </span>
          </div>

          <nav aria-label={t("footer.navigation")}>
            <ul className="flex items-center gap-6">
              {NAV_LINKS.map(({ href, labelKey }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-xs text-[#71717a] hover:text-[#18181b] transition-colors tracking-wide"
                  >
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="text-[10px] text-[#d4d4d8] text-center mt-6 tracking-wide">
          {t("footer.tagline")}
        </p>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
