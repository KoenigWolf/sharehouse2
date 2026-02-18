"use client";

import { useState, useCallback, useId } from "react";
import { m, AnimatePresence } from "framer-motion";
import { CloseButton } from "@/components/ui/close-button";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/use-i18n";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { BULLETIN } from "@/lib/constants/config";
import { getInitials, getDisplayName } from "@/lib/utils";
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

  useEscapeKey(isOpen && !isSubmitting, handleClose);
  useBodyScrollLock(isOpen);

  const displayName = getDisplayName(userProfile);
  const canSubmit = message.trim().length > 0 && !isSubmitting;

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="modal-overlay"
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
            <div className="modal-header">
              <CloseButton onClick={handleClose} disabled={isSubmitting} animated />

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
                {isSubmitting ? <Spinner size="sm" variant="light" /> : t("bulletin.post")}
              </m.button>
            </div>

            <div className="modal-content">
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
