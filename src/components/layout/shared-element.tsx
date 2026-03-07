"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function SharedElementProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

interface SharedElementProps {
  id: string;
  children: ReactNode;
  className?: string;
}

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
