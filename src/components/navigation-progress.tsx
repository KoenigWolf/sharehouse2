"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";

/**
 * Navigation Progress Bar Inner Component
 */
function NavigationProgressInner() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const prevPathRef = useRef(pathname);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link?.href) {
        try {
          const url = new URL(link.href);
          if (url.origin === window.location.origin && url.pathname !== pathname) {
            clearTimers();
            setProgress(0);
            timersRef.current.push(setTimeout(() => setProgress(30), 50));
            timersRef.current.push(setTimeout(() => setProgress(60), 200));
            timersRef.current.push(setTimeout(() => setProgress(80), 500));
          }
        } catch {
          // Ignore invalid URLs
        }
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      clearTimers();
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      clearTimers();
      queueMicrotask(() => {
        setProgress(100);
        timersRef.current.push(setTimeout(() => setProgress(0), 300));
      });
    }
  }, [pathname]);

  const isVisible = progress > 0 && progress < 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          className="fixed top-0 left-0 right-0 z-[100] h-0.5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <m.div
            className="h-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 shadow-[0_0_12px_rgba(74,103,65,0.6)]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: progress < 30 ? 0.2 : 0.4,
              ease: [0.25, 0.46, 0.45, 0.94],
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
