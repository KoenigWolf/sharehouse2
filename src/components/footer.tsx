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
  ShieldCheckIcon,
  HeartIcon,
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

const LEGAL_LINKS: { href: string; labelKey: Parameters<Translator>[0] }[] = [
  { href: "#", labelKey: "footer.terms" },
  { href: "#", labelKey: "footer.privacy" },
];

export const Footer = memo(function Footer({ variant = "default" }: FooterProps) {
  const t = useI18n();

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (variant === "minimal") {
    return (
      <footer className="py-12 mt-auto bg-white/50 backdrop-blur-sm border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-5xl flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-brand-100">S</span>
            <span className="text-lg font-bold tracking-tight text-slate-900">Share<span className="text-brand-600">House</span></span>
          </div>
          <p className="text-xs font-medium text-slate-400 tracking-tight text-center">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto bg-white border-t border-slate-100 relative overflow-hidden">
      {/* Background Decorative Blob */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50/30 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

      <div className="container mx-auto px-6 pt-16 pb-24 sm:pb-16 max-w-6xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 lg:gap-16">

          {/* Brand Section */}
          <div className="md:col-span-4 lg:col-span-5 flex flex-col items-start">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-brand-100 group-hover:scale-105 transition-transform">
                S
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                Share<span className="text-brand-600">House</span>
              </span>
            </Link>
            <p className="text-sm font-medium text-slate-500 mt-6 leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>

            <div className="flex items-center gap-3 mt-8">
              <SNSLink href="#" icon={<TwitterIcon size={18} />} label="Twitter" />
              <SNSLink href="#" icon={<InstagramIcon size={18} />} label="Instagram" />
              <SNSLink href="#" icon={<GithubIcon size={18} />} label="GitHub" />
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
        <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {t("footer.copyrightFull", { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
              <ShieldCheckIcon size={12} className="text-brand-600" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Secured Closed Community</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all text-xs font-bold ring-1 ring-slate-200/50"
            >
              <ArrowUpIcon size={14} />
              {t("footer.backToTop")}
            </button>
          </div>
        </div>

        <div className="mt-12 flex justify-center opacity-30">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
            Made with <HeartIcon size={10} className="text-brand-500" /> by Residents
          </div>
        </div>
      </div>
    </footer>
  );
});

function SNSLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-white hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100 transition-all"
      aria-label={label}
    >
      {icon}
    </Link>
  );
}

function FooterNavSection({ title, links, t }: { title: string; links: typeof NAV_LINKS; t: Translator }) {
  return (
    <div className="flex flex-col">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
        {title}
      </h3>
      <ul className="flex flex-col gap-4">
        {links.map(({ href, labelKey, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 text-sm text-slate-600 hover:text-brand-600 transition-colors font-bold group"
            >
              <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-50 transition-colors">
                <Icon size={16} strokeWidth={2.5} />
              </span>
              {t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterLinkSection({ title, links, t }: { title: string; links: typeof COMMUNITY_LINKS; t: Translator }) {
  return (
    <div className="flex flex-col">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
        {title}
      </h3>
      <ul className="flex flex-col gap-4">
        {links.map(({ href, labelKey }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-sm text-slate-600 hover:text-brand-600 transition-colors font-bold"
            >
              {t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

Footer.displayName = "Footer";
