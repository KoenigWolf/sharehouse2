"use client";

import { m } from "framer-motion";
import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { staggerItem } from "@/lib/animation";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const ActionIcon = action?.icon ?? Plus;

  return (
    <m.div
      variants={staggerItem}
      className={`py-20 flex flex-col items-center text-center ${className}`}
    >
      <div className="w-20 h-20 mb-8 rounded-2xl bg-muted/80 flex items-center justify-center">
        <Icon size={32} className="text-muted-foreground/40" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <m.button
          type="button"
          onClick={action.onClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="h-12 px-7 rounded-full bg-foreground text-background text-sm font-semibold tracking-wide transition-all duration-200 shadow-lg inline-flex items-center gap-2.5"
        >
          <ActionIcon size={18} strokeWidth={2.5} />
          {action.label}
        </m.button>
      )}
    </m.div>
  );
}
