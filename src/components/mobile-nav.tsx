"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Users, MessageCircle, User, Image, Calendar, LogIn } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useUser } from "@/hooks/use-user";
import type { TranslationKey } from "@/lib/i18n";

const NAV_ITEMS: {
  href: string;
  labelKey: TranslationKey;
  icon: typeof Users;
  matchPaths?: string[];
}[] = [
    { href: "/residents", labelKey: "nav.residents", icon: Users },
    { href: "/bulletin", labelKey: "bulletin.title", icon: MessageCircle },
    { href: "/room-photos", labelKey: "nav.gallery", icon: Image },
    { href: "/events", labelKey: "nav.events", icon: Calendar },
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

  const { userId } = useUser();

  const filteredItems = NAV_ITEMS.map(item => {
    if (!userId && item.href === "/settings") {
      return {
        ...item,
        href: "/login",
        labelKey: "auth.login" as TranslationKey,
        icon: LogIn
      };
    }
    return item;
  });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden glass border-t border-slate-200/50 pb-safe shadow-2xl shadow-slate-900/10"
      aria-label={t("a11y.mainNavigation")}
    >
      <div className="flex items-center justify-around h-16 sm:h-20">
        {filteredItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center justify-center flex-1 h-full px-1 py-1 transition-all active:scale-95 group"
            >
              <div className="relative">
                <Icon
                  size={24}
                  strokeWidth={active ? 2.5 : 2}
                  className={`transition-colors duration-300 ${active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                />
                {active && (
                  <motion.span
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brand-500 shadow-lg shadow-brand-200"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
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
