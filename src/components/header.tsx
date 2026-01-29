"use client";

import { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/use-i18n";
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
      className="relative px-2 sm:px-4 py-2 text-xs sm:text-sm tracking-wide transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a1a] focus-visible:ring-offset-2 group"
    >
      <span
        className={
          isActive
            ? "text-[#1a1a1a]"
            : "text-[#a3a3a3] group-hover:text-[#737373] transition-colors"
        }
      >
        {t(item.labelKey)}
      </span>
      {isActive && (
        <m.span
          layoutId="nav-underline"
          className="absolute bottom-0 left-2 right-2 sm:left-4 sm:right-4 h-px bg-[#1a1a1a]"
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      )}
    </Link>
  );
});

NavLink.displayName = "NavLink";

const UserAvatarLink = memo(function UserAvatarLink() {
  const pathname = usePathname();
  const t = useI18n();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const isActive = pathname.startsWith("/profile/");

  useEffect(() => {
    const fetchAvatar = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };
    fetchAvatar();
  }, []);

  const optimizedSrc = getOptimizedImageUrl(avatarUrl);
  const href = userId ? `/profile/${userId}` : "/settings";

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      aria-label={t("nav.myPage")}
      className="relative shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a1a] focus-visible:ring-offset-2 rounded-full"
    >
      <div
        className={`w-8 h-8 rounded-full overflow-hidden transition-all ${
          isActive
            ? "ring-2 ring-[#1a1a1a] ring-offset-1"
            : "ring-1 ring-[#e5e5e5] hover:ring-[#a3a3a3]"
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
          <div className="w-full h-full bg-[#f5f5f3] flex items-center justify-center">
            <User size={16} className="text-[#a3a3a3]" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </Link>
  );
});

UserAvatarLink.displayName = "UserAvatarLink";

export const Header = memo(function Header() {
  const pathname = usePathname();
  const t = useI18n();

  const isPathActive = useCallback(
    (item: NavItem) => pathname === item.href,
    [pathname]
  );

  return (
    <header
      className="sticky top-0 z-40 border-b border-[#e5e5e5] bg-white/95 backdrop-blur-sm"
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between max-w-5xl">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            href="/"
            className="text-[13px] leading-none sm:text-base tracking-[0.15em] sm:tracking-wider text-[#1a1a1a] font-light outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a1a] focus-visible:ring-offset-2"
            aria-label={t("a11y.goHome")}
          >
            SHARE HOUSE
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

        <UserAvatarLink />
      </div>
    </header>
  );
});

Header.displayName = "Header";
