"use client";

import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  className?: string;
}

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  delay: 0.2,
} as const;

export function FloatingActionButton({
  onClick,
  icon: Icon,
  label,
  className = "",
}: FloatingActionButtonProps) {
  return (
    <m.button
      type="button"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={springTransition}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`fixed bottom-24 sm:bottom-8 right-5 sm:right-8 z-40 w-14 h-14 rounded-full bg-foreground text-background shadow-lg shadow-foreground/20 flex items-center justify-center ${className}`}
      aria-label={label}
    >
      <Icon size={22} />
    </m.button>
  );
}
