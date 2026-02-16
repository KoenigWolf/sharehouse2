"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Shared Element Transition System
 *
 * Provides Instagram-like shared element transitions where elements
 * (like profile images) smoothly animate from their source position
 * to their destination position during page navigation.
 *
 * Currently uses Framer Motion's layoutId for automatic shared element
 * transitions. The SharedElementProvider is a simple pass-through wrapper
 * that can be extended in the future for custom transition effects.
 */

/**
 * Provider for shared element transitions.
 * Currently a pass-through wrapper - extend this to add custom
 * transition tracking/coordination if needed.
 */
export function SharedElementProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

interface SharedElementProps {
  id: string;
  children: ReactNode;
  className?: string;
}

/**
 * Shared Element Wrapper
 *
 * Wrap elements that should animate between pages with this component.
 * Uses Framer Motion's layoutId for smooth cross-page transitions.
 */
export function SharedElement({ id, children, className }: SharedElementProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      layoutId={`shared-${id}`}
      className={className}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 30,
        mass: 0.8,
      }}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Shared Avatar Wrapper
 *
 * Specialized shared element for avatar images that maintains
 * aspect ratio and border radius during transitions.
 */
export function SharedAvatar({
  id,
  children,
  className,
}: SharedElementProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      layoutId={`avatar-${id}`}
      className={className}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 35,
        mass: 0.6,
      }}
      style={{
        willChange: "transform",
        transformOrigin: "center center",
      }}
    >
      {children}
    </motion.div>
  );
}
