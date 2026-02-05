"use client";

import { useState, memo, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m, motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MessageCircle,
  User,
  Image as ImageIcon,
  Calendar,
  LogIn,
  MoreHorizontal,
  Gift,
  BarChart3,
  Info,
  Coffee,
  LayoutGrid,
  X,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useUser } from "@/hooks/use-user";
import type { TranslationKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const NAV_ITEMS: {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  matchPaths?: string[];
}[] = [
    { href: "/residents", labelKey: "nav.residents", icon: Users },
    { href: "/bulletin", labelKey: "bulletin.title", icon: MessageCircle },
    { href: "/room-photos", labelKey: "nav.gallery", icon: ImageIcon },
    { href: "/events", labelKey: "nav.events", icon: Calendar },
  ];

const EXTRA_NAV_ITEMS: {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
}[] = [
    { href: "/share", labelKey: "nav.share", icon: Gift },
    { href: "/stats", labelKey: "nav.stats", icon: BarChart3 },
    { href: "/info", labelKey: "nav.info", icon: Info },
    { href: "/tea-time", labelKey: "nav.teaTime", icon: Coffee },
    { href: "/floor-plan", labelKey: "nav.floorPlan", icon: LayoutGrid },
  ];

export const MobileNav = memo(function MobileNav() {
  const pathname = usePathname();
  const t = useI18n();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsDrawerOpen(false);
  }

  const isActive = useCallback((href: string, matchPaths?: string[]) => {
    if (matchPaths) {
      return matchPaths.some(
        (path) => pathname === path || pathname.startsWith(path)
      );
    }
    return pathname === href;
  }, [pathname]);

  const { userId } = useUser();

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const profileItem = {
    href: userId ? `/profile/${userId}` : "/settings",
    labelKey: (userId ? "nav.myPage" : "auth.login") as TranslationKey,
    icon: userId ? User : LogIn,
    matchPaths: userId ? ["/settings", "/profile/"] : ["/login"],
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden glass border-t border-slate-200/50 pb-safe shadow-2xl shadow-slate-900/10"
        aria-label={t("a11y.mainNavigation")}
      >
        <div className="flex items-center justify-around h-16 sm:h-20">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.matchPaths);
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

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="relative flex flex-col items-center justify-center flex-1 h-full px-1 py-1 transition-all active:scale-95 group outline-none"
          >
            <div className="relative">
              <MoreHorizontal
                size={24}
                className="text-slate-400 group-hover:text-slate-600 transition-colors"
                strokeWidth={2}
              />
            </div>
            <span className="sr-only">More</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm sm:hidden"
            />
            <m.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-[2.5rem] p-6 pb-20 shadow-2xl sm:hidden max-h-[85vh] overflow-y-auto overflow-x-hidden"
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-brand-50/50 to-transparent pointer-events-none" />
              <div className="absolute top-10 right-[-10%] w-48 h-48 bg-brand-200/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-20 left-[-10%] w-48 h-48 bg-slate-200/30 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black tracking-tight text-slate-900">
                    Menu
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={closeDrawer}
                    className="rounded-full bg-slate-50"
                  >
                    <X size={20} className="text-slate-500" />
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-1">
                    {[...NAV_ITEMS, profileItem].map((item) => {
                      const active = isActive(item.href, item.matchPaths);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${active
                            ? "bg-brand-50 text-brand-700"
                            : "text-slate-600 active:bg-slate-50"
                            }`}
                        >
                          <div className={`p-2.5 rounded-xl ${active ? "bg-white shadow-sm" : "bg-slate-100"}`}>
                            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                          </div>
                          <span className="flex-1 font-semibold">{t(item.labelKey)}</span>
                          <ChevronRight size={18} className={active ? "text-brand-400" : "text-slate-300"} />
                        </Link>
                      );
                    })}
                  </div>

                  <div className="h-px bg-slate-100 mx-1" />

                  <div className="grid grid-cols-1 gap-1">
                    {EXTRA_NAV_ITEMS.map((item) => {
                      const active = isActive(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${active
                            ? "bg-brand-50 text-brand-700"
                            : "text-slate-600 active:bg-slate-50"
                            }`}
                        >
                          <div className={`p-2.5 rounded-xl ${active ? "bg-white shadow-sm" : "bg-slate-100"}`}>
                            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                          </div>
                          <span className="flex-1 font-semibold">{t(item.labelKey)}</span>
                          <ChevronRight size={18} className={active ? "text-brand-400" : "text-slate-300"} />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-xs text-slate-400">Share House Portal v1.0</p>
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
