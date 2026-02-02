"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Coffee, User, Image, Info } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import type { TranslationKey } from "@/lib/i18n";

const NAV_ITEMS: {
  href: string;
  labelKey: TranslationKey;
  icon: typeof Users;
  matchPaths?: string[];
}[] = [
  { href: "/", labelKey: "nav.residents", icon: Users },
  { href: "/room-photos", labelKey: "nav.gallery", icon: Image },
  { href: "/info", labelKey: "nav.info", icon: Info },
  { href: "/tea-time", labelKey: "nav.teaTime", icon: Coffee },
  {
    href: "/settings",
    labelKey: "nav.myPage",
    icon: User,
    matchPaths: ["/settings", "/profile/"],
  },
];

export const MobileNav = memo(function MobileNav() {
  const pathname = usePathname();
  const t = useI18n();

  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.matchPaths) {
      return item.matchPaths.some(
        (path) => pathname === path || pathname.startsWith(path)
      );
    }
    return pathname === item.href;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white border-t border-[#e4e4e7] pb-safe"
      aria-label={t("a11y.mainNavigation")}
    >
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center justify-center flex-1 h-full px-1 py-3 transition-colors active:bg-[#f4f4f5]"
            >
              <div className="relative">
                <Icon
                  size={24}
                  strokeWidth={active ? 2 : 1.5}
                  className={`transition-colors ${
                    active ? "text-[#18181b]" : "text-[#a1a1aa]"
                  }`}
                />
                {active && (
                  <motion.span
                    layoutId="mobile-nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#18181b]"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </div>
              <span className="sr-only">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
