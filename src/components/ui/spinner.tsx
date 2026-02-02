"use client";

import { m } from "framer-motion";

type SpinnerSize = "xs" | "sm" | "md" | "lg";
type SpinnerVariant = "dark" | "light";

interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
}

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const VARIANT_CLASSES: Record<SpinnerVariant, string> = {
  dark: "border border-[#bdc0ba] border-t-[#272a26]",
  light: "border border-white/30 border-t-white",
};

export function Spinner({ size = "md", variant = "dark", className }: SpinnerProps) {
  return (
    <m.span
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`inline-block rounded-full ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]}${className ? ` ${className}` : ""}`}
    />
  );
}
