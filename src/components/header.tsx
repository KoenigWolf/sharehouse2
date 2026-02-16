"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/use-i18n";
import { useUser } from "@/hooks/use-user";
import { getOptimizedImageUrl } from "@/lib/utils/image";
import {
  ALL_NAV_ITEMS,
  isNavItemActive,
  type NavItem,
} from "@/lib/constants/navigation";

const NavLink = memo(function NavLink({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const t = useI18n();
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      aria-label={t(item.labelKey)}
      title={t(item.labelKey)}
      className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 group"
    >
      <Icon
        size={20}
        strokeWidth={isActive ? 2 : 1.5}
        className={
          isActive
            ? "text-foreground"
            : "text-muted-foreground group-hover:text-foreground transition-colors"
        }
      />
      {isActive && (
        <motion.span
          layoutId="nav-active-indicator"
          className="absolute inset-0 bg-muted rounded-xl -z-10"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
});

NavLink.displayName = "NavLink";

const UserAvatarMenu = memo(function UserAvatarMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useI18n();
  const { userId, avatarUrl, isAdmin } = useUser();

  const isActive = pathname.startsWith("/profile/") || pathname.startsWith("/admin");

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  const optimizedSrc = getOptimizedImageUrl(avatarUrl);
  const profileHref = userId ? `/profile/${userId}` : "/settings";

  if (!userId) {
    return (
      <Link
        href="/login"
        className="h-10 px-5 flex items-center justify-center rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
      >
        {t("auth.login")}
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("nav.myPage")}
          className="relative shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-full cursor-pointer group"
        >
          <div
            className={`w-10 h-10 rounded-full overflow-hidden transition-all duration-200 ring-2 ${
              isActive
                ? "ring-foreground"
                : "ring-border group-hover:ring-foreground/50"
            }`}
          >
            {optimizedSrc ? (
              <Image
                src={optimizedSrc}
                alt={t("nav.myPage")}
                width={40}
                height={40}
                sizes="40px"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <User size={18} className="text-muted-foreground" strokeWidth={1.5} />
              </div>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-52 p-2 rounded-2xl shadow-xl border-border/50 bg-card"
      >
        <DropdownMenuItem asChild className="rounded-xl h-11 px-3 focus:bg-muted cursor-pointer">
          <Link href={profileHref} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <User size={16} strokeWidth={1.5} className="text-muted-foreground" />
            </div>
            <span className="font-medium text-sm text-foreground">{t("nav.myPage")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-xl h-11 px-3 focus:bg-muted cursor-pointer">
          <Link href="/settings" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Settings size={16} strokeWidth={1.5} className="text-muted-foreground" />
            </div>
            <span className="font-medium text-sm text-foreground">{t("nav.settings")}</span>
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild className="rounded-xl h-11 px-3 focus:bg-muted cursor-pointer">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Shield size={16} strokeWidth={1.5} className="text-muted-foreground" />
              </div>
              <span className="font-medium text-sm text-foreground">{t("nav.admin")}</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="my-2 bg-border/50" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="rounded-xl h-11 px-3 focus:bg-muted cursor-pointer group/logout"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover/logout:bg-error/10 transition-colors">
              <LogOut size={16} strokeWidth={1.5} className="text-muted-foreground group-hover/logout:text-error transition-colors" />
            </div>
            <span className="font-medium text-sm text-muted-foreground group-hover/logout:text-error transition-colors">
              {t("nav.logout")}
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

UserAvatarMenu.displayName = "UserAvatarMenu";

export const Header = memo(function Header() {
  const pathname = usePathname();
  const t = useI18n();

  return (
    <header
      className="sticky top-0 z-40 bg-card border-b border-border/30"
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-8 h-14 flex items-center max-w-6xl">
        {/* Left: Navigation text links */}
        <div className="flex-1 flex items-center gap-6">
          {/* Brand - Clean text style */}
          <Link
            href="/residents"
            className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group"
            aria-label={t("a11y.goHome")}
          >
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors tracking-wide">
              {t("header.brand")}
            </span>
          </Link>

          {/* Separator */}
          <div className="hidden sm:block w-px h-4 bg-border" />

          {/* Current section indicator */}
          <span className="hidden sm:block text-sm font-bold text-foreground tracking-wide">
            {(() => {
              // Profile edit page (more specific, check first)
              if (pathname.includes("/profile/") && pathname.endsWith("/edit")) {
                return t("profile.editTitle");
              }
              // Profile pages
              if (pathname.startsWith("/profile/")) {
                return t("profile.title");
              }
              // Settings pages
              if (pathname.startsWith("/settings")) {
                return t("nav.settings");
              }
              // Admin pages
              if (pathname.startsWith("/admin")) {
                return t("nav.admin");
              }
              // Legal pages
              if (pathname === "/legal/privacy") {
                return t("legal.privacyTitle");
              }
              if (pathname === "/legal/terms") {
                return t("legal.termsTitle");
              }
              // Event detail pages (match parent nav item)
              if (pathname.startsWith("/events/")) {
                return t("nav.events");
              }
              // Check navigation items
              const activeItem = ALL_NAV_ITEMS.find((item) =>
                isNavItemActive(pathname, item)
              );
              return activeItem ? t(activeItem.labelKey) : t("header.brand");
            })()}
          </span>
        </div>

        {/* Center: Navigation - Desktop */}
        <nav
          aria-label={t("a11y.mainNavigation")}
          className="hidden lg:flex items-center gap-1"
        >
          {ALL_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isNavItemActive(pathname, item)}
            />
          ))}
        </nav>

        {/* Right: User Menu */}
        <div className="flex-1 flex items-center justify-end">
          <UserAvatarMenu />
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";
