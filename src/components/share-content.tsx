"use client";

import { useState, useCallback, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Gift, Plus, X, Clock, Trash2, Check } from "lucide-react";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/hooks/use-i18n";
import { createShareItem, claimShareItem, deleteShareItem } from "@/lib/share/actions";
import { SHARE_ITEMS } from "@/lib/constants/config";
import { getInitials } from "@/lib/utils";
import type { ShareItemWithProfile } from "@/domain/share-item";

const EASE = [0.23, 1, 0.32, 1] as const;

interface ShareComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string | null) => Promise<void>;
  isSubmitting: boolean;
}

function ShareComposeModal({ isOpen, onClose, onSubmit, isSubmitting }: ShareComposeModalProps) {
  const t = useI18n();
  const id = useId();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleClose = useCallback(() => {
    setTitle("");
    setDescription("");
    onClose();
  }, [onClose]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onSubmit(title.trim(), description.trim() || null);
    setTitle("");
    setDescription("");
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

  const canSubmit = title.trim().length > 0 && !isSubmitting;

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-background sm:bg-black/50 sm:backdrop-blur-sm"
          onClick={isSubmitting ? undefined : handleClose}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:rounded-2xl bg-background sm:premium-surface flex flex-col sm:max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border/50 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                aria-label={t("common.close")}
              >
                <X size={20} className="text-foreground" />
              </button>

              <h2 id={`${id}-title`} className="text-sm font-bold text-foreground">
                {t("share.createItem")}
              </h2>

              <m.button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.02 } : undefined}
                whileTap={canSubmit ? { scale: 0.98 } : undefined}
                className="h-9 px-5 rounded-full bg-foreground text-background text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {isSubmitting ? t("common.processing") : t("share.post")}
              </m.button>
            </div>

            {/* Form area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                  <Gift size={20} className="text-brand-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("share.createHint")}
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-muted-foreground tracking-wide ml-1">
                    {t("share.titleLabel")} <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("share.titlePlaceholder")}
                    maxLength={SHARE_ITEMS.maxTitleLength}
                    autoFocus
                    className="w-full h-13 px-5 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 focus:bg-background transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-muted-foreground tracking-wide ml-1">
                    {t("share.descriptionLabel")}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("share.descriptionPlaceholder")}
                    maxLength={SHARE_ITEMS.maxDescriptionLength}
                    rows={3}
                    className="w-full px-5 py-4 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 focus:bg-background transition-all duration-200 resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

interface ShareContentProps {
  items: ShareItemWithProfile[];
  currentUserId: string;
  isTeaser?: boolean;
}

function formatTimeRemaining(expiresAt: string): string {
  const now = Date.now();
  const expires = new Date(expiresAt).getTime();
  const diffMs = expires - now;

  if (diffMs <= 0) return "";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMin = Math.floor(diffMs / 60000);
    return `${diffMin}m`;
  }
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

// Animation config
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function ShareContent({ items, currentUserId, isTeaser = false }: ShareContentProps) {
  const t = useI18n();
  const router = useRouter();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handlePost = useCallback(async (title: string, description: string | null) => {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);

    const result = await createShareItem(title, description);
    setIsSubmitting(false);

    if ("error" in result) {
      setFeedback({ type: "error", message: result.error });
      return;
    }
    setIsComposeOpen(false);
    router.refresh();
  }, [isSubmitting, router]);

  const handleClaim = useCallback(async (itemId: string) => {
    setIsSubmitting(true);
    const result = await claimShareItem(itemId);
    setIsSubmitting(false);
    if ("error" in result) {
      setFeedback({ type: "error", message: result.error });
    } else {
      router.refresh();
    }
  }, [router]);

  const handleDelete = useCallback(async (itemId: string) => {
    if (!confirm(t("share.deleteConfirm"))) return;
    setIsSubmitting(true);
    const result = await deleteShareItem(itemId);
    setIsSubmitting(false);
    if ("error" in result) {
      setFeedback({ type: "error", message: result.error });
    } else {
      router.refresh();
    }
  }, [t, router]);

  return (
    <>
      {/* Compose Modal */}
      <ShareComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSubmit={handlePost}
        isSubmitting={isSubmitting}
      />

      <m.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <m.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className={`text-sm font-medium px-5 py-4 rounded-xl border-l-4 ${
                feedback.type === "success"
                  ? "bg-success-bg/50 border-success text-success"
                  : "bg-error-bg/50 border-error text-error"
              }`}
            >
              {feedback.message}
            </m.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {items.length === 0 ? (
          <m.div
            variants={itemVariants}
            className="py-20 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 mb-8 rounded-2xl bg-muted/80 flex items-center justify-center">
              <Gift size={32} className="text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {t("share.empty")}
            </h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
              {t("share.emptyHint")}
            </p>
            {!isTeaser && (
              <m.button
                type="button"
                onClick={() => { setIsComposeOpen(true); setFeedback(null); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-12 px-7 rounded-full bg-foreground text-background text-sm font-semibold tracking-wide transition-all duration-200 shadow-lg inline-flex items-center gap-2.5"
              >
                <Plus size={18} strokeWidth={2.5} />
                {t("share.post")}
              </m.button>
            )}
          </m.div>
        ) : (
        /* Item grid - 2 columns on desktop */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {items.map((item, index) => {
            const displayName = item.profiles?.nickname ?? item.profiles?.name ?? t("common.formerResident");
            const isMine = item.user_id === currentUserId;
            const isClaimed = item.status === "claimed";
            const timeLeft = formatTimeRemaining(item.expires_at);

            return (
              <m.article
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.05,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={!isClaimed ? { y: -3, transition: { duration: 0.2 } } : {}}
                className={`premium-surface rounded-2xl p-5 sm:p-6 flex flex-col group ${
                  isClaimed ? "opacity-60" : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 rounded-lg border border-border/50">
                      <OptimizedAvatarImage
                        src={item.profiles?.avatar_url}
                        alt={displayName}
                        context="card"
                        isBlurred={isTeaser}
                        fallback={
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {getInitials(displayName)}
                          </span>
                        }
                        fallbackClassName="bg-muted"
                      />
                    </Avatar>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate block">
                        {displayName}
                      </span>
                      {item.profiles?.room_number && (
                        <span className="text-xs text-muted-foreground">
                          {item.profiles.room_number}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time remaining badge */}
                  {timeLeft && !isClaimed && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-lg">
                      <Clock size={12} />
                      {timeLeft}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2 mb-5">
                  <h4 className={`text-base font-bold ${
                    isTeaser ? "blur-[2.5px] select-none" : isClaimed ? "text-muted-foreground line-through" : "text-foreground"
                  }`}>
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className={`text-sm leading-relaxed ${
                      isTeaser ? "blur-[3px] select-none" : isClaimed ? "text-muted-foreground/60" : "text-muted-foreground"
                    }`}>
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                  {isClaimed ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                      <Check size={14} />
                      {t("share.claimed")}
                    </span>
                  ) : !isMine ? (
                    <m.button
                      type="button"
                      onClick={() => !isTeaser && handleClaim(item.id)}
                      disabled={isSubmitting || isTeaser}
                      whileHover={!isTeaser ? { scale: 1.03 } : {}}
                      whileTap={!isTeaser ? { scale: 0.97 } : {}}
                      className={`h-10 px-6 rounded-xl bg-foreground text-background text-sm font-semibold transition-all duration-200 ${
                        isTeaser ? "opacity-50 cursor-not-allowed" : "hover:bg-foreground/90"
                      }`}
                    >
                      {t("share.claim")}
                    </m.button>
                  ) : (
                    <div />
                  )}

                  {isMine && !isClaimed && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={isSubmitting}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all"
                      aria-label={t("common.delete")}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </m.article>
            );
          })}
        </div>
      )}
      </m.div>

      {/* FAB - Floating Action Button */}
      {!isTeaser && (
        <m.button
          type="button"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setIsComposeOpen(true); setFeedback(null); }}
          className="fixed bottom-24 sm:bottom-8 right-5 sm:right-8 z-40 w-14 h-14 rounded-full bg-foreground text-background shadow-lg shadow-foreground/20 flex items-center justify-center"
          aria-label={t("share.post")}
        >
          <Gift size={22} />
        </m.button>
      )}
    </>
  );
}
