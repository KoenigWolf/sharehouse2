"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
import { useI18n } from "@/hooks/use-i18n";
import type { TranslationKey } from "@/lib/i18n";

// =============================================================================
// Types
// =============================================================================

interface NavItem {
  href: string;
  labelKey: TranslationKey;
  matchPaths?: string[];
}

// =============================================================================
// Constants
// =============================================================================

const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "nav.residents" },
  { href: "/room-photos", labelKey: "nav.gallery" },
  { href: "/info", labelKey: "nav.info" },
  { href: "/tea-time", labelKey: "nav.teaTime" },
  { href: "/settings", labelKey: "nav.myPage", matchPaths: ["/settings", "/profile/"] },
];

// =============================================================================
// Sub-components
// =============================================================================

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  layoutId: string;
}

const NavLink = memo(function NavLink({ item, isActive, layoutId }: NavLinkProps) {
  const t = useI18n();

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className="relative px-2 sm:px-4 py-2 text-xs sm:text-sm tracking-wide transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a1a] focus-visible:ring-offset-2 group"
    >
      <span
        className={
          isActive
            ? "text-[#1a1a1a]"
            : "text-[#a3a3a3] group-hover:text-[#737373] transition-colors"
        }
      >
        {t(item.labelKey)}
      </span>
      {isActive && (
        <m.span
          layoutId={layoutId}
          className="absolute bottom-0 left-2 right-2 sm:left-4 sm:right-4 h-px bg-[#1a1a1a]"
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      )}
    </Link>
  );
});

NavLink.displayName = "NavLink";

// =============================================================================
// Main Component
// =============================================================================

export const Header = memo(function Header() {
  const pathname = usePathname();
  const t = useI18n();

  const isPathActive = useCallback(
    (item: NavItem) => {
      if (item.matchPaths) {
        return item.matchPaths.some(
          (path) => pathname === path || pathname.startsWith(path)
        );
      }
      return pathname === item.href;
    },
    [pathname]
  );

  return (
    <header
      className="sticky top-0 z-40 border-b border-[#e5e5e5] bg-white/95 backdrop-blur-sm"
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center gap-4 sm:gap-8 max-w-5xl">
        <Link
          href="/"
          className="text-[11px] leading-tight sm:text-base sm:leading-normal tracking-wider text-[#1a1a1a] font-light outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a1a] focus-visible:ring-offset-2"
          aria-label={t("a11y.goHome")}
        >
          <span className="sm:hidden">
            SHARE
            <br />
            HOUSE
          </span>
          <span className="hidden sm:inline">SHARE HOUSE</span>
        </Link>

        <nav
          aria-label={t("a11y.mainNavigation")}
          className="hidden sm:flex items-center"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isPathActive(item)}
              layoutId="nav-underline"
            />
          ))}
        </nav>
      </div>
    </header>
  );
});

Header.displayName = "Header";
