"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";

/**
 * Navigation Progress Bar Inner Component
 */
function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const prevPathRef = useRef(pathname);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clear all timers
  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  // Listen for navigation start (via click interception)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link?.href) {
        try {
          const url = new URL(link.href);
          // Only show progress for internal navigation to different path
          if (url.origin === window.location.origin && url.pathname !== pathname) {
            clearTimers();
            setProgress(0);

            // Phase 1: Quick initial progress
            timersRef.current.push(setTimeout(() => setProgress(30), 50));
            // Phase 2: Slower progress
            timersRef.current.push(setTimeout(() => setProgress(60), 200));
            timersRef.current.push(setTimeout(() => setProgress(80), 500));
          }
        } catch {
          // Invalid URL, ignore
        }
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      clearTimers();
    };
  }, [pathname]);

  // Complete progress when pathname changes
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      clearTimers();
      // Use microtask to avoid synchronous setState in effect
      queueMicrotask(() => setProgress(100));

      // Fade out after completion
      timersRef.current.push(setTimeout(() => setProgress(0), 200));
    }
  }, [pathname, searchParams]);

  const isVisible = progress > 0 && progress < 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          className="fixed top-0 left-0 right-0 z-[100] h-0.5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <m.div
            className="h-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 shadow-[0_0_12px_rgba(74,103,65,0.6)]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: progress < 30 ? 0.15 : 0.4,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        </m.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Navigation Progress Bar
 *
 * High-quality loading indicator that shows during page transitions.
 * Uses a two-phase animation:
 * 1. Quick initial progress (0-30%) for immediate feedback
 * 2. Slower continuation (30-90%) while loading
 * 3. Fast completion (90-100%) when done
 */
export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
