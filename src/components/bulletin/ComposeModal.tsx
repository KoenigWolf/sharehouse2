"use client";

import { useState, useCallback, useEffect, useId } from "react";
import { m, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/hooks/use-i18n";
import { BULLETIN } from "@/lib/constants/config";
import { getInitials } from "@/lib/utils";
import { SPRING, SPRING_SOFT } from "./utils";

export interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
  isSubmitting: boolean;
  userProfile?: {
    name: string;
    nickname: string | null;
    avatar_url: string | null;
  };
}

export function ComposeModal({ isOpen, onClose, onSubmit, isSubmitting, userProfile }: ComposeModalProps) {
  const t = useI18n();
  const id = useId();
  const [message, setMessage] = useState("");

  const handleClose = useCallback(() => {
    setMessage("");
    onClose();
  }, [onClose]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    await onSubmit(message.trim());
    setMessage("");
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) handleClose();
    },
    [isSubmitting, handleClose],
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

  const displayName = userProfile?.nickname ?? userProfile?.name ?? "";
  const canSubmit = message.trim().length > 0 && !isSubmitting;

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-background sm:bg-black/50 sm:backdrop-blur-sm"
          onClick={isSubmitting ? undefined : handleClose}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            initial={{ opacity: 0, y: "100%", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: "50%", scale: 0.95 }}
            transition={SPRING_SOFT}
            className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:rounded-2xl bg-background sm:premium-surface flex flex-col sm:max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border/50 shrink-0">
              <m.button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                aria-label={t("common.close")}
              >
                <X size={20} className="text-foreground" />
              </m.button>

              <h2 id={`${id}-title`} className="sr-only">
                {t("bulletin.postMessage")}
              </h2>

              <m.button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.03 } : undefined}
                whileTap={canSubmit ? { scale: 0.97 } : undefined}
                transition={SPRING}
                className="h-9 px-5 rounded-full bg-foreground text-background text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <m.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <m.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full"
                    />
                  </m.span>
                ) : (
                  t("bulletin.post")
                )}
              </m.button>
            </div>

            {/* Compose area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10 rounded-full border border-border/50 shrink-0">
                  <OptimizedAvatarImage
                    src={userProfile?.avatar_url}
                    alt={displayName}
                    context="card"
                    fallback={
                      <span className="text-xs font-semibold text-muted-foreground">
                        {getInitials(displayName)}
                      </span>
                    }
                    fallbackClassName="bg-muted"
                  />
                </Avatar>

                <div className="flex-1 min-w-0">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("bulletin.placeholder")}
                    maxLength={BULLETIN.maxMessageLength}
                    autoFocus
                    rows={6}
                    className="w-full bg-transparent text-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Footer with character count */}
            <div className="px-4 py-3 border-t border-border/50 shrink-0">
              <div className="flex items-center justify-between">
                <m.span
                  className="text-xs text-muted-foreground tabular-nums"
                  animate={{
                    color: message.length > BULLETIN.maxMessageLength * 0.9 ? "rgb(239, 68, 68)" : undefined,
                  }}
                >
                  {message.length}/{BULLETIN.maxMessageLength}
                </m.span>
                {message.length > BULLETIN.maxMessageLength * 0.8 && (
                  <m.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={SPRING}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-muted/30"
                      />
                      <m.circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className={message.length > BULLETIN.maxMessageLength * 0.9 ? "text-error" : "text-brand-500"}
                        style={{
                          strokeDasharray: 100,
                          strokeDashoffset: 100 - (message.length / BULLETIN.maxMessageLength) * 100,
                          transformOrigin: "center",
                          transform: "rotate(-90deg)",
                        }}
                      />
                    </svg>
                  </m.div>
                )}
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
