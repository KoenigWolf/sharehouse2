"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import { useI18n } from "@/hooks/use-i18n";
import type { Translator } from "@/lib/i18n";
import {
  ArrowUpIcon,
  UsersIcon,
  CalendarIcon,
  MessageCircleIcon,
  GiftIcon,
  ImageIcon,
  InfoIcon,
  MapIcon,
  CoffeeIcon,
  BarChart3Icon,
  HomeIcon,
  MailIcon,
  MapPinIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FooterVariant = "default" | "minimal";

interface FooterProps {
  variant?: FooterVariant;
}

const NAV_LINKS: { href: string; labelKey: Parameters<Translator>[0]; icon: LucideIcon }[] = [
  { href: "/residents", labelKey: "nav.residents", icon: UsersIcon },
  { href: "/events", labelKey: "nav.events", icon: CalendarIcon },
  { href: "/bulletin", labelKey: "bulletin.title", icon: MessageCircleIcon },
  { href: "/share", labelKey: "nav.share", icon: GiftIcon },
  { href: "/room-photos", labelKey: "nav.gallery", icon: ImageIcon },
];

const MORE_LINKS: { href: string; labelKey: Parameters<Translator>[0]; icon: LucideIcon }[] = [
  { href: "/contact", labelKey: "contact.title", icon: MailIcon },
  { href: "/tour", labelKey: "tour.title", icon: MapPinIcon },
  { href: "/stats", labelKey: "nav.stats", icon: BarChart3Icon },
  { href: "/info", labelKey: "nav.info", icon: InfoIcon },
  { href: "/tea-time", labelKey: "nav.teaTime", icon: CoffeeIcon },
  { href: "/floor-plan", labelKey: "nav.floorPlan", icon: MapIcon },
];

const LEGAL_LINKS: { href: string; labelKey: Parameters<Translator>[0] }[] = [
  { href: "/legal/terms", labelKey: "footer.terms" },
  { href: "/legal/privacy", labelKey: "footer.privacy" },
];

export const Footer = memo(function Footer({ variant = "default" }: FooterProps) {
  const t = useI18n();

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (variant === "minimal") {
    return (
      <footer className="py-10 mt-auto bg-background border-t border-border/50">
        <div className="container mx-auto px-6 flex flex-col items-center gap-5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <HomeIcon size={14} className="text-background" strokeWidth={2} />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              Share<span className="text-muted-foreground">House</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto bg-muted/30 border-t border-border/50">
      <div className="container mx-auto px-6 py-14 sm:py-16 max-w-5xl">
        {/* Main Grid - Golden ratio: 5:8 ≈ brand:nav */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* Brand Column - 5/12 ≈ 0.417 (close to 1/φ) */}
          <div className="lg:col-span-5 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <HomeIcon size={22} className="text-background" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Share<span className="text-muted-foreground">House</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t("footer.communityPortal")}</p>
              </div>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>

            {/* Community indicator */}
            <div className="hidden lg:flex items-center gap-3 p-3 bg-background rounded-2xl border border-border/50 w-fit">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center"
                    style={{ zIndex: 3 - i }}
                  >
                    <UsersIcon size={12} className="text-muted-foreground" />
                  </div>
                ))}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {t("footer.joinCommunity")}
              </span>
            </div>
          </div>

          {/* Navigation Grid - 7/12 */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10 lg:gap-8">

            {/* Main Navigation */}
            <FooterNavSection
              title={t("footer.directory")}
              links={NAV_LINKS}
              t={t}
            />

            {/* More Links */}
            <FooterNavSection
              title={t("footer.more")}
              links={MORE_LINKS}
              t={t}
            />

            {/* Legal & Back to Top */}
            <div className="col-span-2 sm:col-span-1 space-y-8">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("footer.legal")}
                </h3>
                <ul className="space-y-3">
                  {LEGAL_LINKS.map(({ href, labelKey }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {t(labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Back to top - visible on mobile too */}
              <button
                type="button"
                onClick={scrollToTop}
                className="h-11 px-5 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center gap-2 group"
              >
                {t("footer.backToTop")}
                <ArrowUpIcon size={16} className="group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-14 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {t("footer.copyrightFull", { year: new Date().getFullYear() })}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {t("footer.madeWithCare")}
          </p>
        </div>
      </div>
    </footer>
  );
});

function FooterNavSection({
  title,
  links,
  t
}: {
  title: string;
  links: typeof NAV_LINKS;
  t: Translator
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map(({ href, labelKey, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Icon size={16} strokeWidth={1.5} className="text-muted-foreground/60 group-hover:text-foreground transition-colors" />
              <span>{t(labelKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

Footer.displayName = "Footer";
