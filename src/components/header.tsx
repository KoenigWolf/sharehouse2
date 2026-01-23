"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/use-i18n";
import type { TranslationKey } from "@/lib/i18n";

/**
 * Navigation items configuration
 */
const NAV_ITEMS: { href: string; labelKey: TranslationKey }[] = [
  { href: "/", labelKey: "nav.residents" },
  { href: "/tea-time", labelKey: "nav.teaTime" },
];

/**
 * Application header with navigation
 */
export const Header = memo(function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useI18n();

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  const isSettingsActive =
    pathname === "/settings" || pathname.startsWith("/profile/");

  return (
    <header className="border-b border-[#e5e5e5] bg-white" role="banner">
      <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo and main navigation */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-base tracking-wider text-[#1a1a1a] font-light"
            aria-label={t("a11y.goHome")}
          >
            SHARE HOUSE
          </Link>

          <nav
            aria-label={t("a11y.mainNavigation")}
            className="hidden sm:flex"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className="relative px-4 py-2 text-sm tracking-wide transition-colors group"
                >
                  <span
                    className={
                      isActive
                        ? "text-[#1a1a1a]"
                        : "text-[#a3a3a3] group-hover:text-[#737373]"
                    }
                  >
                    {t(item.labelKey)}
                  </span>
                  {/* Underline */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-4 right-4 h-px bg-[#1a1a1a]"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile nav */}
          <nav aria-label={t("a11y.mainNavigation")} className="flex sm:hidden gap-4">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`text-xs tracking-wide transition-colors ${
                    isActive ? "text-[#1a1a1a]" : "text-[#a3a3a3]"
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User menu */}
        <nav
          aria-label={t("a11y.userMenu")}
          className="flex items-center"
        >
          <Link
            href="/settings"
            aria-label={t("a11y.openMyPage")}
            aria-current={isSettingsActive ? "page" : undefined}
            className="relative px-3 sm:px-4 py-2 text-xs sm:text-sm tracking-wide transition-colors group"
          >
            <span
              className={
                isSettingsActive
                  ? "text-[#1a1a1a]"
                  : "text-[#a3a3a3] group-hover:text-[#737373]"
              }
            >
              {t("nav.myPage")}
            </span>
            {isSettingsActive && (
              <motion.span
                layoutId="user-nav-underline"
                className="absolute bottom-0 left-3 right-3 sm:left-4 sm:right-4 h-px bg-[#1a1a1a]"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
            )}
          </Link>

          {/* Separator */}
          <span className="w-px h-3 bg-[#e5e5e5]" aria-hidden="true" />

          <button
            type="button"
            onClick={handleLogout}
            aria-label={t("a11y.logout")}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-[#a3a3a3] hover:text-[#737373] tracking-wide transition-colors"
          >
            {t("nav.logout")}
          </button>
        </nav>
      </div>
    </header>
  );
});
