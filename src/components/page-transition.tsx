"use client";

import { useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";

/**
 * Instagram-style page transition variants
 * Fast, smooth transitions with minimal perceived loading time
 */
const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.995,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
      opacity: { duration: 0.2 },
      scale: { duration: 0.3 },
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.998,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const reducedMotionVariants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Page Transition Wrapper
 *
 * Provides Instagram-level smooth page transitions:
 * - Fast fade + subtle scale for seamless feel
 * - Exit animation completes before enter starts
 * - Respects reduced motion preferences
 * - Minimal layout shift with fixed positioning during transition
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? reducedMotionVariants : pageVariants;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="enter"
        exit="exit"
        className="w-full"
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}

/**
 * View Transitions API Hook (Progressive Enhancement)
 *
 * Uses the native View Transitions API when available for
 * hardware-accelerated, native-feeling page transitions.
 * Falls back gracefully when not supported.
 */
export function useViewTransition() {
  const isSupported = typeof document !== "undefined" && "startViewTransition" in document;

  const startTransition = useCallback(
    (callback: () => void | Promise<void>) => {
      if (isSupported) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).startViewTransition(callback);
      } else {
        callback();
      }
    },
    [isSupported]
  );

  return { isSupported, startTransition };
}

/**
 * Scroll Position Manager Hook
 *
 * Preserves and restores scroll position when navigating back,
 * providing Instagram-like instant back navigation feel.
 */
export function useScrollRestoration() {
  const pathname = usePathname();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const prevPathname = useRef<string>(pathname);

  useEffect(() => {
    // Save current scroll position before navigation
    const handleScroll = () => {
      scrollPositions.current.set(prevPathname.current, window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Check if this is a "back" navigation (we have saved position)
      const savedPosition = scrollPositions.current.get(pathname);

      if (savedPosition !== undefined) {
        // Restore scroll position after a micro-delay to allow render
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedPosition, behavior: "instant" });
        });
      } else {
        // New page - scroll to top
        window.scrollTo({ top: 0, behavior: "instant" });
      }

      prevPathname.current = pathname;
    }
  }, [pathname]);
}

/**
 * Navigation Intent Hook
 *
 * Detects user's navigation intent (hover on links) and
 * provides haptic-like visual feedback before actual navigation.
 */
export function useNavigationIntent() {
  const intentRef = useRef<string | null>(null);

  const setIntent = useCallback((href: string | null) => {
    intentRef.current = href;
  }, []);

  const getIntent = useCallback(() => intentRef.current, []);

  return { setIntent, getIntent };
}
