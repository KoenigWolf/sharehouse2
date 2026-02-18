"use client";

import { m } from "framer-motion";
import { X } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

interface CloseButtonProps {
  onClick: () => void;
  disabled?: boolean;
  animated?: boolean;
  className?: string;
}

export function CloseButton({
  onClick,
  disabled = false,
  animated = false,
  className = "",
}: CloseButtonProps) {
  const t = useI18n();

  const baseClassName = `w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
    disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
  } ${className}`;

  if (animated) {
    return (
      <m.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }}
        whileTap={disabled ? undefined : { scale: 0.95 }}
        className={baseClassName}
        aria-label={t("common.close")}
      >
        <X size={20} className="text-foreground" />
      </m.button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={baseClassName}
      aria-label={t("common.close")}
    >
      <X size={20} className="text-foreground" />
    </button>
  );
}
