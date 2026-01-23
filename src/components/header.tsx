"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";

/**
 * Navigation items configuration
 */
const NAV_ITEMS = [
  { href: "/", label: "住民", ariaLabel: "住民一覧を見る" },
  { href: "/tea-time", label: "Tea Time", ariaLabel: "ティータイムページを見る" },
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

  const isSettingsActive = pathname === "/settings" || pathname.startsWith("/profile/");

  return (
    <header className="border-b border-[#e5e5e5] bg-white" role="banner">
      <div className="container mx-auto px-3 sm:px-4 h-12 flex items-center justify-between">
        {/* Logo and main navigation */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="text-xs sm:text-sm font-medium tracking-wider text-[#1a1a1a]"
            aria-label="Share House ホームに戻る"
          >
            SHARE HOUSE
          </Link>

          <nav aria-label={t("a11y.mainNavigation")} className="flex gap-2 sm:gap-4">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.ariaLabel}
                  aria-current={isActive ? "page" : undefined}
                  className={`text-[11px] sm:text-xs tracking-wide transition-colors ${
                    isActive
                      ? "text-[#b94a48]"
                      : "text-[#737373] hover:text-[#1a1a1a]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User menu */}
        <nav aria-label={t("a11y.userMenu")} className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/settings"
            aria-label="マイページを開く"
            aria-current={isSettingsActive ? "page" : undefined}
            className={`text-[11px] sm:text-xs tracking-wide transition-colors ${
              isSettingsActive
                ? "text-[#b94a48]"
                : "text-[#737373] hover:text-[#1a1a1a]"
            }`}
          >
            {t("nav.myPage")}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label={t("a11y.logout")}
            className="text-[11px] sm:text-xs text-[#a3a3a3] hover:text-[#1a1a1a] transition-colors"
          >
            {t("nav.logout")}
          </button>
        </nav>
      </div>
    </header>
  );
});
