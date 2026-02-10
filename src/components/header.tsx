"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { m } from "framer-motion";
import {
  Users,
  MessageCircle,
  Gift,
  Calendar,
  Image as ImageIcon,
  Info,
  Coffee,
  LayoutGrid,
  BarChart3,
  User,
  Settings,
  LogOut,
  Shield,
  Home,
} from "lucide-react";
import { ICON_SIZE, ICON_STROKE } from "@/lib/constants/icons";
import { Button } from "@/components/ui/button";
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
import type { TranslationKey } from "@/lib/i18n";

interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: typeof Users;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/residents", labelKey: "nav.residents", icon: Users },
  { href: "/bulletin", labelKey: "bulletin.title", icon: MessageCircle },
  { href: "/share", labelKey: "nav.share", icon: Gift },
  { href: "/events", labelKey: "nav.events", icon: Calendar },
  { href: "/room-photos", labelKey: "nav.gallery", icon: ImageIcon },
  { href: "/stats", labelKey: "nav.stats", icon: BarChart3 },
  { href: "/info", labelKey: "nav.info", icon: Info },
  { href: "/tea-time", labelKey: "nav.teaTime", icon: Coffee },
  { href: "/floor-plan", labelKey: "nav.floorPlan", icon: LayoutGrid },
];

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
}

const NavLink = memo(function NavLink({ item, isActive }: NavLinkProps) {
  const t = useI18n();
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      aria-label={t(item.labelKey)}
      title={t(item.labelKey)}
      className="relative px-3 py-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 group rounded-lg"
    >
      <div className="relative z-10 flex items-center justify-center">
        <Icon
          size={ICON_SIZE.lg}
          strokeWidth={isActive ? ICON_STROKE.medium : ICON_STROKE.normal}
          className={
            isActive
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground transition-colors"
          }
        />
      </div>
      {isActive && (
        <m.span
          layoutId="nav-active-bar"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
      <Button asChild variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-primary">
        <Link href="/login">{t("auth.login")}</Link>
      </Button>
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
            className={`w-9 h-9 rounded-full overflow-hidden transition-all border-2 ${isActive
              ? "border-primary shadow-sm"
              : "border-border group-hover:border-primary/50"
              }`}
          >
            {optimizedSrc ? (
              <Image
                src={optimizedSrc}
                alt={t("nav.myPage")}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <User size={ICON_SIZE.md} className="text-muted-foreground" strokeWidth={ICON_STROKE.normal} />
              </div>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-48 p-1.5 rounded-2xl shadow-xl border-border">
        <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-secondary cursor-pointer">
          <Link href={profileHref} className="flex items-center">
            <User size={ICON_SIZE.md} strokeWidth={ICON_STROKE.normal} className="mr-3 text-muted-foreground" />
            <span className="font-semibold text-sm text-foreground/80">{t("nav.myPage")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-secondary cursor-pointer">
          <Link href="/settings" className="flex items-center">
            <Settings size={ICON_SIZE.md} strokeWidth={ICON_STROKE.normal} className="mr-3 text-muted-foreground" />
            <span className="font-semibold text-sm text-foreground/80">{t("nav.settings")}</span>
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-secondary cursor-pointer">
            <Link href="/admin" className="flex items-center">
              <Shield size={ICON_SIZE.md} strokeWidth={ICON_STROKE.normal} className="mr-3 text-muted-foreground" />
              <span className="font-semibold text-sm text-foreground/80">{t("nav.admin")}</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="my-1.5 bg-border" />
        <DropdownMenuItem onClick={handleLogout} className="rounded-xl px-3 py-2.5 focus:bg-secondary cursor-pointer group/logout">
          <LogOut size={ICON_SIZE.md} strokeWidth={ICON_STROKE.normal} className="mr-3 text-muted-foreground group-hover/logout:text-foreground transition-colors" />
          <span className="font-semibold text-sm text-muted-foreground group-hover/logout:text-foreground">{t("nav.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

UserAvatarMenu.displayName = "UserAvatarMenu";

export const Header = memo(function Header() {
  const pathname = usePathname();
  const t = useI18n();

  const isPathActive = useCallback(
    (item: NavItem) => pathname === item.href,
    [pathname]
  );

  return (
    <header
      className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border"
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between max-w-5xl">
        <div className="flex items-center gap-6 sm:gap-10">
          <Link
            href="/residents"
            className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group"
            aria-label={t("a11y.goHome")}
          >
            <Home size={ICON_SIZE.lg} className="text-primary" strokeWidth={ICON_STROKE.medium} />
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold tracking-tight text-foreground">
                Share<span className="text-primary">House</span>
              </span>
            </div>
          </Link>

          <nav
            aria-label={t("a11y.mainNavigation")}
            className="hidden sm:flex items-center gap-1"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={isPathActive(item)}
              />
            ))}
          </nav>
        </div>

        <UserAvatarMenu />
      </div>
    </header>
  );
});

Header.displayName = "Header";
