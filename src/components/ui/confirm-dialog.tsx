"use client";

import { useEffect, useCallback, useId } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  loadingLabel?: string;
  isLoading?: boolean;
  error?: string;
  variant?: "default" | "destructive";
  children?: React.ReactNode;
}

const EASE = [0.23, 1, 0.32, 1] as const;

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel,
  cancelLabel,
  loadingLabel,
  isLoading = false,
  error,
  variant = "default",
  children,
}: ConfirmDialogProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  const isDestructive = variant === "destructive";

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    },
    [isLoading, onCancel],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={isLoading ? undefined : onCancel}
        >
          <m.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="w-full max-w-sm bg-card rounded-2xl premium-surface p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <h2
                id={titleId}
                className={`text-sm font-bold tracking-tight ${isDestructive ? "text-rose-900" : "text-foreground"}`}
              >
                {title}
              </h2>
              <p
                id={descId}
                className={`text-xs leading-relaxed ${isDestructive ? "text-rose-600/70" : "text-foreground/80"}`}
              >
                {description}
              </p>
            </div>

            {children}

            {error && (
              <p className="py-2 px-3 border-l-2 border-error-border bg-error-bg text-xs text-error rounded">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
                autoFocus
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={isDestructive ? "destructive" : "default"}
                size="sm"
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner size="xs" />
                    {loadingLabel ?? confirmLabel}
                  </>
                ) : (
                  confirmLabel
                )}
              </Button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
