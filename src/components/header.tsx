"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { m } from "framer-motion";
import { User, LogOut } from "lucide-react";
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
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "nav.residents" },
  { href: "/room-photos", labelKey: "nav.gallery" },
  { href: "/info", labelKey: "nav.info" },
  { href: "/tea-time", labelKey: "nav.teaTime" },
];

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
}

const NavLink = memo(function NavLink({ item, isActive }: NavLinkProps) {
  const t = useI18n();

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className="relative px-2 sm:px-4 py-2 text-xs sm:text-sm tracking-wide transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] focus-visible:ring-offset-2 group"
    >
      <span
        className={
          isActive
            ? "text-[#18181b]"
            : "text-[#a1a1aa] group-hover:text-[#71717a] transition-colors"
        }
      >
        {t(item.labelKey)}
      </span>
      {isActive && (
        <m.span
          layoutId="nav-underline"
          className="absolute bottom-0 left-2 right-2 sm:left-4 sm:right-4 h-px bg-[#18181b]"
          transition={{ duration: 0.25, ease: "easeOut" }}
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
  const { userId, avatarUrl } = useUser();

  const isActive = pathname.startsWith("/profile/");

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
          className="relative shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] focus-visible:ring-offset-2 rounded-full cursor-pointer"
        >
          <div
            className={`w-8 h-8 rounded-full overflow-hidden transition-all ${
              isActive
                ? "ring-2 ring-[#18181b] ring-offset-1"
                : "ring-1 ring-[#e4e4e7] hover:ring-[#a1a1aa]"
            }`}
          >
            {optimizedSrc ? (
              <Image
                src={optimizedSrc}
                alt={t("nav.myPage")}
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-[#f4f4f5] flex items-center justify-center">
                <User size={16} className="text-[#a1a1aa]" strokeWidth={1.5} />
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
      className="sticky top-0 z-40 border-b border-[#e4e4e7] bg-white/95 backdrop-blur-sm"
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between max-w-5xl">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            href="/"
            className="text-[13px] leading-none sm:text-base tracking-[0.15em] sm:tracking-wider text-[#18181b] font-light outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] focus-visible:ring-offset-2"
            aria-label={t("a11y.goHome")}
          >
            <span className="sm:hidden flex flex-col leading-none gap-0.5">
              <span>SHARE</span>
              <span>HOUSE</span>
            </span>
            <span className="hidden sm:inline">SHARE HOUSE</span>
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
