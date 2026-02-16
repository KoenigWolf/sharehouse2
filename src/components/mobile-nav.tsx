"use client";

import { useState, memo, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m, motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal,
  X,
  ChevronRight,
  LogOut,
  Shield,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  MOBILE_BOTTOM_NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  SETTINGS_NAV_ITEM,
  getProfileNavItem,
  isNavItemActive,
  type NavItem,
} from "@/lib/constants/navigation";

interface NavItemButtonProps {
  item: NavItem;
  isActive: boolean;
  showLabel?: boolean;
}

const NavItemButton = memo(function NavItemButton({
  item,
  isActive,
  showLabel = true,
}: NavItemButtonProps) {
  const t = useI18n();
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className="relative flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1.5 transition-all active:scale-95 group"
    >
      <div className="relative">
        <Icon
          size={22}
          strokeWidth={isActive ? 2.5 : 2}
          className={`transition-colors duration-200 ${
            isActive
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground"
          }`}
        />
        {isActive && (
          <motion.span
            layoutId="mobile-nav-indicator"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </div>
      {showLabel && (
        <span
          className={`mt-1 text-[10px] font-medium leading-none transition-colors ${
            isActive ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {t(item.labelKey)}
        </span>
      )}
    </Link>
  );
});

NavItemButton.displayName = "NavItemButton";

interface DrawerNavItemProps {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}

const DrawerNavItem = memo(function DrawerNavItem({
  item,
  isActive,
  onClick,
}: DrawerNavItemProps) {
  const t = useI18n();
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all min-h-[56px] ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-foreground/80 active:bg-secondary hover:bg-secondary/50"
      }`}
    >
      <div
        className={`w-10 h-10 flex items-center justify-center rounded-xl ${
          isActive ? "bg-card shadow-sm" : "bg-secondary"
        }`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      <span className="flex-1 font-semibold text-[15px]">{t(item.labelKey)}</span>
      <ChevronRight
        size={18}
        className={isActive ? "text-primary/60" : "text-muted-foreground/40"}
      />
    </Link>
  );
});

DrawerNavItem.displayName = "DrawerNavItem";

export const MobileNav = memo(function MobileNav() {
  const pathname = usePathname();
  const t = useI18n();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Auto-close drawer on route change
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsDrawerOpen(false);
  }

  const { userId, isAdmin } = useUser();
  const profileItem = getProfileNavItem(userId);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    closeDrawer();
    window.location.href = "/login";
  }, [closeDrawer]);

  // Lock body scroll when drawer is open
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

  // Check if any item in More drawer is active
  const isMoreActive =
    !MOBILE_BOTTOM_NAV_ITEMS.some((item) => isNavItemActive(pathname, item)) &&
    [...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS, SETTINGS_NAV_ITEM, profileItem].some(
      (item) => isNavItemActive(pathname, item)
    );

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-card/95 backdrop-blur-md border-t border-border/50 pb-safe shadow-lg"
        aria-label={t("a11y.mainNavigation")}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {MOBILE_BOTTOM_NAV_ITEMS.map((item) => (
            <NavItemButton
              key={item.href}
              item={item}
              isActive={isNavItemActive(pathname, item)}
            />
          ))}

          {/* More Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-expanded={isDrawerOpen}
            aria-haspopup="dialog"
            className="relative flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1.5 transition-all active:scale-95 group outline-none"
          >
            <div className="relative">
              <MoreHorizontal
                size={22}
                strokeWidth={isMoreActive ? 2.5 : 2}
                className={`transition-colors ${
                  isMoreActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              {isMoreActive && (
                <motion.span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                  layoutId="mobile-nav-more-indicator"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </div>
            <span
              className={`mt-1 text-[10px] font-medium leading-none ${
                isMoreActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {t("mobileNav.more")}
            </span>
          </button>
        </div>
      </nav>

      {/* More Menu Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={closeDrawer}
              className="fixed inset-0 z-[60] bg-foreground/30 backdrop-blur-sm sm:hidden"
              aria-hidden="true"
            />

            {/* Drawer */}
            <m.div
              role="dialog"
              aria-modal="true"
              aria-label={t("mobileNav.menu")}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-x-0 bottom-0 z-[70] bg-card rounded-t-3xl shadow-2xl sm:hidden max-h-[85vh] overflow-hidden will-change-transform"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

              {/* Content */}
              <div className="relative overflow-y-auto max-h-[85vh] pb-safe">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm px-5 pt-4 pb-3 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">
                      {t("mobileNav.menu")}
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={closeDrawer}
                      className="rounded-full bg-secondary hover:bg-secondary/80 w-9 h-9"
                      aria-label={t("common.close")}
                    >
                      <X size={18} className="text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <div className="px-4 py-4 space-y-5 pb-8">
                  {/* Main Navigation */}
                  <section>
                    <h3 className="px-4 mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Main
                    </h3>
                    <div className="space-y-1">
                      {PRIMARY_NAV_ITEMS.map((item) => (
                        <DrawerNavItem
                          key={item.href}
                          item={item}
                          isActive={isNavItemActive(pathname, item)}
                          onClick={closeDrawer}
                        />
                      ))}
                    </div>
                  </section>

                  {/* Utilities */}
                  <section>
                    <h3 className="px-4 mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Utilities
                    </h3>
                    <div className="space-y-1">
                      {SECONDARY_NAV_ITEMS.map((item) => (
                        <DrawerNavItem
                          key={item.href}
                          item={item}
                          isActive={isNavItemActive(pathname, item)}
                          onClick={closeDrawer}
                        />
                      ))}
                    </div>
                  </section>

                  {/* Account */}
                  <section>
                    <h3 className="px-4 mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Account
                    </h3>
                    <div className="space-y-1">
                      <DrawerNavItem
                        item={profileItem}
                        isActive={isNavItemActive(pathname, profileItem)}
                        onClick={closeDrawer}
                      />
                      <DrawerNavItem
                        item={SETTINGS_NAV_ITEM}
                        isActive={isNavItemActive(pathname, SETTINGS_NAV_ITEM)}
                        onClick={closeDrawer}
                      />
                      {isAdmin && (
                        <DrawerNavItem
                          item={{
                            href: "/admin",
                            labelKey: "nav.admin",
                            icon: Shield,
                          }}
                          isActive={pathname.startsWith("/admin")}
                          onClick={closeDrawer}
                        />
                      )}
                      {userId && (
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl transition-all min-h-[56px] text-foreground/80 active:bg-secondary hover:bg-secondary/50"
                        >
                          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary">
                            <LogOut size={20} strokeWidth={2} className="text-error/80" />
                          </div>
                          <span className="flex-1 text-left font-semibold text-[15px] text-error/80">
                            {t("nav.logout")}
                          </span>
                        </button>
                      )}
                    </div>
                  </section>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-border/30 bg-secondary/30">
                  <p className="text-center text-xs text-muted-foreground">
                    {t("mobileNav.brand")}
                  </p>
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
