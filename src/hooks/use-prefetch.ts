"use client";

import { useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Prefetch routes on hover/touch for faster navigation
 *
 * Returns a single prefetch callback that can be used as event handler.
 * Automatically resets when href changes so new routes get prefetched.
 *
 * Usage:
 * const prefetch = usePrefetch("/some-route");
 * <Link href="/some-route" onMouseEnter={prefetch} onTouchStart={prefetch}>
 */
export function usePrefetch(href: string) {
  const router = useRouter();
  const prefetched = useRef(false);

  // Reset prefetched state when href changes
  useEffect(() => {
    prefetched.current = false;
  }, [href]);

  const prefetch = useCallback(() => {
    if (!prefetched.current && href && !href.startsWith("http")) {
      router.prefetch(href);
      prefetched.current = true;
    }
  }, [href, router]);

  return prefetch;
}

/**
 * Prefetch multiple routes at once
 *
 * Usage:
 * const { prefetchAll } = usePrefetchRoutes(["/residents", "/events", "/bulletin"]);
 */
export function usePrefetchRoutes(routes: string[]) {
  const router = useRouter();
  const prefetched = useRef<Set<string>>(new Set());
  const routesRef = useRef(routes);

  // Update routes ref when routes change
  useEffect(() => {
    routesRef.current = routes;
  }, [routes]);

  const prefetchAll = useCallback(() => {
    for (const route of routesRef.current) {
      if (!prefetched.current.has(route) && !route.startsWith("http")) {
        router.prefetch(route);
        prefetched.current.add(route);
      }
    }
  }, [router]);

  return { prefetchAll };
}
