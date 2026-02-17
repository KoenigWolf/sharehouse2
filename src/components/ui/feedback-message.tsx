"use client";

import { m, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackType = "success" | "error" | "info";

interface FeedbackMessageProps {
  type: FeedbackType;
  message: string;
  /** Optional: Show dismiss button */
  onDismiss?: () => void;
  /** Optional: Additional class names */
  className?: string;
}

const STYLE_MAP: Record<FeedbackType, { container: string; icon: typeof CheckCircle }> = {
  success: {
    container: "bg-success-bg/50 border-success text-success",
    icon: CheckCircle,
  },
  error: {
    container: "bg-error-bg/50 border-error text-error",
    icon: AlertCircle,
  },
  info: {
    container: "bg-secondary/80 border-muted-foreground/30 text-foreground",
    icon: Info,
  },
};

/**
 * Consistent feedback message component for success/error/info states.
 * Use this instead of inline feedback styling for consistency across the app.
 *
 * @example
 * ```tsx
 * {feedback && (
 *   <FeedbackMessage
 *     type={feedback.type}
 *     message={feedback.message}
 *     onDismiss={() => setFeedback(null)}
 *   />
 * )}
 * ```
 */
export function FeedbackMessage({
  type,
  message,
  onDismiss,
  className,
}: FeedbackMessageProps) {
  const { container, icon: Icon } = STYLE_MAP[type];

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-3 rounded-xl px-4 py-3 border-l-4 text-sm font-medium",
        container,
        className
      )}
    >
      <Icon size={18} className="shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

/**
 * Animated version with enter/exit transitions.
 * Wraps FeedbackMessage with AnimatePresence support.
 */
export function AnimatedFeedbackMessage({
  show,
  ...props
}: FeedbackMessageProps & { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <FeedbackMessage {...props} />
        </m.div>
      )}
    </AnimatePresence>
  );
}
