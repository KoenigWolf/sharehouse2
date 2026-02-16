"use client";

import { useState, useCallback, useRef, useEffect, type MouseEvent, memo } from "react";
import Link, { type LinkProps } from "next/link";
import { m } from "framer-motion";
import { usePrefetch } from "@/hooks/use-prefetch";

interface OptimisticLinkProps extends Omit<LinkProps, "onMouseEnter" | "onTouchStart"> {
  children: React.ReactNode;
  className?: string;
  /** Add visual feedback on touch/click */
  showFeedback?: boolean;
  /** Prefetch on hover (default: true) */
  prefetchOnHover?: boolean;
  /** Accessibility label */
  "aria-label"?: string;
}

/**
 * Optimistic Link Component
 *
 * Instagram-style link that provides instant visual feedback
 * before navigation completes. Features:
 * - Immediate tap/click response
 * - Optimistic scale animation
 * - Smart prefetching on hover/touch
 * - Works with Next.js App Router
 */
export const OptimisticLink = memo(function OptimisticLink({
  href,
  children,
  className = "",
  showFeedback = true,
  prefetchOnHover = true,
  "aria-label": ariaLabel,
  ...linkProps
}: OptimisticLinkProps) {
  const [isPressed, setIsPressed] = useState(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hrefString = typeof href === "string" ? href : href.pathname ?? "";
  const prefetch = usePrefetch(hrefString);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (prefetchOnHover) {
      prefetch();
    }
  }, [prefetchOnHover, prefetch]);

  const handleTouchStart = useCallback(() => {
    prefetch();
    if (showFeedback) {
      setIsPressed(true);
    }
  }, [prefetch, showFeedback]);

  const handleTouchEnd = useCallback(() => {
    // Clear any existing timer before starting a new one
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    // Small delay before releasing press state for visual feedback
    pressTimerRef.current = setTimeout(() => {
      setIsPressed(false);
      pressTimerRef.current = null;
    }, 100);
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (showFeedback && e.button === 0) {
      setIsPressed(true);
    }
  }, [showFeedback]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  const linkRef = useRef<HTMLAnchorElement>(null);

  if (!showFeedback) {
    return (
      <Link
        href={href}
        className={className}
        aria-label={ariaLabel}
        onMouseEnter={handleMouseEnter}
        onTouchStart={handleTouchStart}
        {...linkProps}
      >
        {children}
      </Link>
    );
  }

  return (
    <m.div
      animate={{
        scale: isPressed ? 0.97 : 1,
        opacity: isPressed ? 0.9 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 0.5,
      }}
      className="will-change-transform"
    >
      <Link
        ref={linkRef}
        href={href}
        className={className}
        aria-label={ariaLabel}
        onMouseEnter={handleMouseEnter}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...linkProps}
      >
        {children}
      </Link>
    </m.div>
  );
});

/**
 * Card Link Component
 *
 * Optimized for card-style navigation with enhanced
 * hover and touch states.
 */
interface CardLinkProps extends Omit<OptimisticLinkProps, "showFeedback" | "prefetchOnHover"> {
  /** Enable hover lift effect (desktop) */
  hoverLift?: boolean;
}

export const CardLink = memo(function CardLink({
  href,
  children,
  className = "",
  hoverLift = true,
  "aria-label": ariaLabel,
  ...linkProps
}: CardLinkProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const pressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hrefString = typeof href === "string" ? href : href.pathname ?? "";
  const prefetch = usePrefetch(hrefString);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
        pressTimeoutRef.current = null;
      }
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    prefetch();
    setIsHovered(true);
  }, [prefetch]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0) setIsPressed(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleTouchStart = useCallback(() => {
    prefetch();
    setIsPressed(true);
  }, [prefetch]);

  const handleTouchEnd = useCallback(() => {
    // Clear any existing timer before starting a new one
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
    }
    pressTimeoutRef.current = setTimeout(() => {
      setIsPressed(false);
      pressTimeoutRef.current = null;
    }, 100);
  }, []);

  return (
    <m.div
      animate={{
        scale: isPressed ? 0.98 : 1,
        y: hoverLift && isHovered && !isPressed ? -2 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      className="will-change-transform"
    >
      <Link
        href={href}
        className={className}
        aria-label={ariaLabel}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...linkProps}
      >
        {children}
      </Link>
    </m.div>
  );
});
