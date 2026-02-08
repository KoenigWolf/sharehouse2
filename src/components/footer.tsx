"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import { useI18n } from "@/hooks/use-i18n";
import type { Translator } from "@/lib/i18n";
import {
  TwitterIcon,
  InstagramIcon,
  GithubIcon,
  ArrowUpIcon,
  HomeIcon,
  UsersIcon,
  ImageIcon,
  InfoIcon,
  MapIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FooterVariant = "default" | "minimal";

interface FooterProps {
  variant?: FooterVariant;
}

const NAV_LINKS: { href: string; labelKey: Parameters<Translator>[0]; icon: LucideIcon }[] = [
  { href: "/", labelKey: "nav.home", icon: HomeIcon },
  { href: "/residents", labelKey: "nav.residents", icon: UsersIcon },
  { href: "/room-photos", labelKey: "nav.gallery", icon: ImageIcon },
  { href: "/info", labelKey: "nav.info", icon: InfoIcon },
  { href: "/floor-plan", labelKey: "nav.floorPlan", icon: MapIcon },
];

const COMMUNITY_LINKS: { href: string; labelKey: Parameters<Translator>[0] }[] = [
  { href: "/bulletin", labelKey: "bulletin.title" },
  { href: "/events", labelKey: "events.title" },
  { href: "/share", labelKey: "share.title" },
];

const LEGAL_LINKS: { href: string | null; labelKey: Parameters<Translator>[0] }[] = [
  { href: null, labelKey: "footer.terms" },
  { href: null, labelKey: "footer.privacy" },
];

export const Footer = memo(function Footer({ variant = "default" }: FooterProps) {
  const t = useI18n();

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (variant === "minimal") {
    return (
      <footer className="py-12 mt-auto bg-muted backdrop-blur-sm border-t border-border">
        <div className="container mx-auto px-6 max-w-5xl flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <HomeIcon size={18} className="text-foreground" strokeWidth={2.5} />
            <span className="text-lg font-bold tracking-tight text-foreground">Share<span className="text-brand-500">House</span></span>
          </div>
          <p className="text-xs font-medium text-muted-foreground tracking-tight text-center">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto bg-muted border-t border-border relative overflow-hidden">

      <div className="container mx-auto px-6 pt-16 pb-24 sm:pb-16 max-w-6xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 lg:gap-16">

          {/* Brand Section */}
          <div className="md:col-span-4 lg:col-span-5 flex flex-col items-start">
            <Link href="/" className="flex items-center gap-2 group">
              <HomeIcon size={22} className="text-foreground transition-transform group-hover:scale-105" strokeWidth={2.5} />
              <span className="text-2xl font-black tracking-tight text-foreground">
                Share<span className="text-brand-500">House</span>
              </span>
            </Link>
            <p className="text-sm font-medium text-muted-foreground mt-6 leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>

            <div className="flex items-center gap-3 mt-8">
              <SNSPlaceholder icon={<TwitterIcon size={18} />} label="Twitter" />
              <SNSPlaceholder icon={<InstagramIcon size={18} />} label="Instagram" />
              <SNSPlaceholder icon={<GithubIcon size={18} />} label="GitHub" />
            </div>
          </div>

          {/* Links Sections */}
          <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10 md:gap-8">
            <FooterNavSection title={t("footer.directory")} links={NAV_LINKS} t={t} />
            <FooterLinkSection title={t("footer.community")} links={COMMUNITY_LINKS} t={t} />
            <FooterLinkSection title={t("footer.legal")} links={LEGAL_LINKS} t={t} />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              {t("footer.copyrightFull", { year: new Date().getFullYear() })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-400 ease-out delay-150 text-xs font-bold ring-1 ring-slate-200/50"
            >
              <ArrowUpIcon size={14} />
              {t("footer.backToTop")}
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
});

function SNSPlaceholder({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground/70 border border-border cursor-default"
      aria-label={label}
    >
      {icon}
    </span>
  );
}

function FooterNavSection({ title, links, t }: { title: string; links: typeof NAV_LINKS; t: Translator }) {
  return (
    <div className="flex flex-col">
      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6">
        {title}
      </h3>
      <ul className="flex flex-col gap-4">
        {links.map(({ href, labelKey, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors font-semibold group"
            >
              <Icon size={16} strokeWidth={2} className="text-muted-foreground group-hover:text-foreground/80" />
              {t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterLinkSection({ title, links, t }: { title: string; links: typeof COMMUNITY_LINKS | typeof LEGAL_LINKS; t: Translator }) {
  return (
    <div className="flex flex-col">
      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6">
        {title}
      </h3>
      <ul className="flex flex-col gap-4">
        {links.map(({ href, labelKey }) => (
          <li key={labelKey as string}>
            {href ? (
              <Link
                href={href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-semibold"
              >
                {t(labelKey)}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground/70 font-semibold cursor-default">
                {t(labelKey)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

Footer.displayName = "Footer";
