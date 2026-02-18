import type { Variants } from "framer-motion";

// Cubic bezier easing curves
export const EASE_MODAL = [0.23, 1, 0.32, 1] as const;
export const EASE_OUT = [0.32, 0.72, 0, 1] as const;
export const EASE_NATURAL = [0.25, 0.46, 0.45, 0.94] as const;

// Spring physics configs
export const SPRING = { type: "spring", stiffness: 500, damping: 30, mass: 1 } as const;
export const SPRING_SOFT = { type: "spring", stiffness: 300, damping: 25 } as const;

// Standard stagger animation variants
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: EASE_NATURAL,
    },
  },
};
