import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Use shimmer effect instead of pulse (Instagram-style) */
  shimmer?: boolean;
}

/**
 * Skeleton Component
 *
 * Loading placeholder with two animation styles:
 * - Default: Standard pulse animation
 * - Shimmer: Instagram-style sliding gradient effect
 */
function Skeleton({
  className,
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-secondary relative overflow-hidden",
        !shimmer && "animate-pulse",
        className
      )}
      {...props}
    >
      {shimmer && (
        <div className="absolute inset-0 shimmer" />
      )}
    </div>
  );
}

export { Skeleton };
