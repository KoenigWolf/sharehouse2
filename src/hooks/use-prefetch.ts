"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Prefetch routes on hover/touch for faster navigation
 *
 * Usage:
 * const { onMouseEnter, onTouchStart } = usePrefetch("/some-route");
 * <Link href="/some-route" onMouseEnter={onMouseEnter} onTouchStart={onTouchStart}>
 */
export function usePrefetch(href: string) {
  const router = useRouter();
  const prefetched = useRef(false);

  const prefetch = useCallback(() => {
    if (!prefetched.current && href && !href.startsWith("http")) {
      router.prefetch(href);
      prefetched.current = true;
    }
  }, [href, router]);

  const onMouseEnter = useCallback(() => {
    prefetch();
  }, [prefetch]);

  const onTouchStart = useCallback(() => {
    prefetch();
  }, [prefetch]);

  const onFocus = useCallback(() => {
    prefetch();
  }, [prefetch]);

  return { onMouseEnter, onTouchStart, onFocus };
}

/**
 * Prefetch multiple routes at once
 *
 * Usage:
 * usePrefetchRoutes(["/residents", "/events", "/bulletin"]);
 */
export function usePrefetchRoutes(routes: string[]) {
  const router = useRouter();
  const prefetched = useRef<Set<string>>(new Set());

  const prefetchAll = useCallback(() => {
    for (const route of routes) {
      if (!prefetched.current.has(route) && !route.startsWith("http")) {
        router.prefetch(route);
        prefetched.current.add(route);
      }
    }
  }, [routes, router]);

  return { prefetchAll };
}
