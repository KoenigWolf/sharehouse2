/**
 * Centralized navigation configuration
 *
 * Single source of truth for all navigation items across desktop and mobile.
 * Ensures consistency between header.tsx and mobile-nav.tsx.
 */

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
  Settings,
  User,
  LogIn,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

export interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  /** Additional paths to match for active state */
  matchPaths?: string[];
}

/**
 * Primary navigation items - shown in both desktop header and mobile
 * Order matters: most frequently used items first
 */
export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/residents", labelKey: "nav.residents", icon: Users },
  { href: "/events", labelKey: "nav.events", icon: Calendar },
  { href: "/bulletin", labelKey: "bulletin.title", icon: MessageCircle },
  { href: "/share", labelKey: "nav.share", icon: Gift },
  { href: "/room-photos", labelKey: "nav.gallery", icon: ImageIcon },
];

/**
 * Secondary navigation items - shown in desktop header and mobile drawer
 */
export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/info", labelKey: "nav.info", icon: Info },
  { href: "/concept", labelKey: "nav.concept", icon: Coffee },
  { href: "/tea-time", labelKey: "nav.teaTime", icon: Coffee },
  { href: "/floor-plan", labelKey: "nav.floorPlan", icon: LayoutGrid },
  { href: "/stats", labelKey: "nav.stats", icon: BarChart3 },
];

/**
 * All main navigation items (primary + secondary)
 * Used in desktop header
 */
export const ALL_NAV_ITEMS: NavItem[] = [
  ...PRIMARY_NAV_ITEMS,
  ...SECONDARY_NAV_ITEMS,
];

/**
 * Mobile bottom bar items - 4 most important items
 * Keep this small for usability (max 5 including More button)
 */
export const MOBILE_BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/residents", labelKey: "nav.residents", icon: Users },
  { href: "/events", labelKey: "nav.events", icon: Calendar },
  { href: "/bulletin", labelKey: "bulletin.title", icon: MessageCircle },
  { href: "/room-photos", labelKey: "nav.gallery", icon: ImageIcon },
];

/**
 * Settings and user-related navigation
 */
export const SETTINGS_NAV_ITEM: NavItem = {
  href: "/settings",
  labelKey: "nav.settings",
  icon: Settings,
};

/**
 * Creates a dynamic profile/login nav item based on user state
 */
export function getProfileNavItem(userId: string | null): NavItem {
  if (userId) {
    return {
      href: `/profile/${userId}`,
      labelKey: "nav.myPage",
      icon: User,
      matchPaths: ["/settings", "/profile/"],
    };
  }
  return {
    href: "/login",
    labelKey: "auth.login",
    icon: LogIn,
    matchPaths: ["/login"],
  };
}

/**
 * Check if a path matches a nav item
 */
export function isNavItemActive(
  pathname: string,
  item: NavItem
): boolean {
  if (item.matchPaths) {
    return item.matchPaths.some(
      (path) => pathname === path || pathname.startsWith(path)
    );
  }
  return pathname === item.href;
}
