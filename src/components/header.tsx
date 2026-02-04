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
  User,
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
      className="relative px-3 py-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 group"
    >
      <Icon
        size={20}
        strokeWidth={isActive ? 2 : 1.5}
        className={
          isActive
            ? "text-brand-600"
            : "text-slate-400 group-hover:text-brand-600 transition-colors"
        }
      />
      {isActive && (
        <m.span
          layoutId="nav-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("nav.myPage")}
          className="relative shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-full cursor-pointer group"
        >
          <div
            className={`w-9 h-9 rounded-full overflow-hidden transition-all border border-slate-200 ${isActive
              ? "border-brand-500 ring-2 ring-brand-500 ring-offset-2 shadow-lg"
              : "group-hover:border-brand-400 group-hover:shadow-md"
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
              <div className="w-full h-full bg-[#f4f4f5] flex items-center justify-center">
                <User size={20} className="text-[#a1a1aa]" strokeWidth={2} />
              </div>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-40">
        <DropdownMenuItem asChild>
          <Link href={profileHref} className="cursor-pointer">
            <User size={14} strokeWidth={1.5} />
            {t("nav.myPage")}
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer">
              <Shield size={14} strokeWidth={1.5} />
              {t("nav.admin")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-[#a1a1aa]">
          <LogOut size={14} strokeWidth={1.5} />
          {t("nav.logout")}
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
      className="sticky top-0 z-40 glass border-b border-slate-200/50"
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between max-w-5xl">
        <div className="flex items-center gap-6 sm:gap-12">
          <Link
            href="/residents"
            className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 hover:opacity-80 transition-opacity"
            aria-label={t("a11y.goHome")}
          >
            <span>Share</span>
            <span className="text-brand-600">House</span>
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
