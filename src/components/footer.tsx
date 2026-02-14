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
import { ICON_SIZE, ICON_STROKE } from "@/lib/constants/icons";

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
      <footer className="py-8 mt-auto bg-background/80 backdrop-blur-md border-t border-border/50">
        <div className="container mx-auto px-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
            <span className="text-sm font-bold tracking-widest uppercase">ShareHouse</span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto bg-background border-t border-border relative overflow-hidden">
      {/* Massive Brand Background - Subtle & Fixed */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none select-none opacity-[0.03] dark:opacity-[0.02]">
        <span className="absolute -bottom-[10vw] -left-[2vw] text-[25vw] font-black leading-none tracking-tighter text-foreground whitespace-nowrap">
          SHARE
        </span>
      </div>

      <div className="container mx-auto px-6 pt-24 pb-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full">
            <div className="space-y-8">
              <Link href="/" className="inline-block group">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-none group-hover:text-foreground/80 transition-colors">
                  Share<span className="text-muted-foreground">House</span>.
                </h2>
              </Link>
              <p className="text-muted-foreground max-w-sm text-sm leading-relaxed font-medium">
                {t("footer.tagline")}
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-4 mt-12 bg-muted/30 p-2 pr-6 rounded-full w-fit backdrop-blur-sm border border-border/50">
              <div className="flex -space-x-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-background border-2 border-muted flex items-center justify-center relative z-[3-i]">
                    <UsersIcon size={12} className="text-muted-foreground" />
                  </div>
                ))}
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Join the community
              </span>
            </div>
          </div>

          {/* Navigation Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-8">
            <FooterNavSection title={t("footer.directory")} links={NAV_LINKS} t={t} />
            <div className="space-y-12">
              <FooterLinkSection title={t("footer.community")} links={COMMUNITY_LINKS} t={t} />
              <FooterLinkSection title={t("footer.legal")} links={LEGAL_LINKS} t={t} />
            </div>

            {/* Socials & Action */}
            <div className="col-span-2 md:col-span-1 flex flex-col justify-between">
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  Socials
                </h3>
                <div className="flex flex-col gap-4">
                  <SocialLink icon={<TwitterIcon size={18} />} label="Twitter" href="#" />
                  <SocialLink icon={<InstagramIcon size={18} />} label="Instagram" href="#" />
                  <SocialLink icon={<GithubIcon size={18} />} label="GitHub" href="#" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-24 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {t("footer.copyrightFull", { year: new Date().getFullYear() })}
          </p>

          <button
            onClick={scrollToTop}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 shadow-lg hover:shadow-xl text-xs font-bold tracking-wide"
          >
            {t("footer.backToTop")}
            <ArrowUpIcon size={14} className="group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
});

function SocialLink({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group w-fit"
    >
      <span className="p-2 rounded-full bg-muted/50 group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
        {icon}
      </span>
      <span className="font-medium group-hover:translate-x-1 transition-transform duration-300">
        {label}
      </span>
    </a>
  );
}

function FooterNavSection({ title, links, t }: { title: string; links: typeof NAV_LINKS; t: Translator }) {
  return (
    <div className="flex flex-col">
      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-8">
        {title}
      </h3>
      <ul className="flex flex-col gap-5">
        {links.map(({ href, labelKey }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium relative group inline-flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300"></span>
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
      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-8">
        {title}
      </h3>
      <ul className="flex flex-col gap-4">
        {links.map(({ href, labelKey }) => (
          <li key={labelKey as string}>
            {href ? (
              <Link
                href={href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium hover:underline decoration-border underline-offset-4"
              >
                {t(labelKey)}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground/60 font-medium cursor-not-allowed">
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
