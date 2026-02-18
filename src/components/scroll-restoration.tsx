"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function ScrollRestoration() {
  const pathname = usePathname();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const prevPathname = useRef<string | null>(null);
  const isBackNavigation = useRef(false);

  // Track navigation direction using popstate
  useEffect(() => {
    const handlePopState = () => {
      isBackNavigation.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Save scroll position continuously
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (prevPathname.current) {
            scrollPositions.current.set(prevPathname.current, window.scrollY);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle scroll on navigation
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Save final position of previous page
      if (prevPathname.current) {
        scrollPositions.current.set(prevPathname.current, window.scrollY);
      }

      // Determine if we should restore or reset scroll
      const savedPosition = scrollPositions.current.get(pathname);

      if (isBackNavigation.current && savedPosition !== undefined) {
        // Back navigation - restore saved position
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedPosition, behavior: "instant" });
        });
      } else {
        // Forward navigation - scroll to top
        window.scrollTo({ top: 0, behavior: "instant" });
      }

      prevPathname.current = pathname;
      isBackNavigation.current = false;
    }
  }, [pathname]);

  return null;
}
