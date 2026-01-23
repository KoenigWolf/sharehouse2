"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";

/**
 * Navigation items configuration
 */
const NAV_ITEMS = [
  { href: "/", label: "住民" },
  { href: "/tea-time", label: "Tea Time" },
] as const;

/**
 * Application header with navigation
 */
export const Header = memo(function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  const isSettingsActive =
    pathname === "/settings" || pathname.startsWith("/profile/");

  // Find active nav index for underline
  const activeNavIndex = NAV_ITEMS.findIndex((item) => pathname === item.href);

  return (
    <header className="border-b border-[#e5e5e5] bg-white" role="banner">
      <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo and main navigation */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-base tracking-wider text-[#1a1a1a] font-light"
            aria-label="Share House ホームに戻る"
          >
            SHARE HOUSE
          </Link>

          <nav
            aria-label={t("a11y.mainNavigation")}
            className="hidden sm:flex relative"
          >
            <div className="flex">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                      isActive ? "text-[#1a1a1a]" : "text-[#a3a3a3] hover:text-[#737373]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            {/* Animated underline */}
            {activeNavIndex >= 0 && (
              <motion.div
                className="absolute bottom-0 h-px bg-[#1a1a1a]"
                initial={false}
                animate={{
                  left: `${activeNavIndex * 50}%`,
                  width: "50%",
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
            )}
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
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User menu */}
        <nav
          aria-label={t("a11y.userMenu")}
          className="flex items-center gap-4 sm:gap-6"
        >
          <Link
            href="/settings"
            aria-label="マイページを開く"
            aria-current={isSettingsActive ? "page" : undefined}
            className={`text-xs sm:text-sm tracking-wide transition-colors ${
              isSettingsActive
                ? "text-[#1a1a1a]"
                : "text-[#a3a3a3] hover:text-[#737373]"
            }`}
          >
            {t("nav.myPage")}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label={t("a11y.logout")}
            className="text-xs sm:text-sm text-[#a3a3a3] hover:text-[#737373] transition-colors"
          >
            {t("nav.logout")}
          </button>
        </nav>
      </div>
    </header>
  );
});
