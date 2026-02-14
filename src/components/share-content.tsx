"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Gift, Plus, X, Clock, Trash2, Check } from "lucide-react";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/hooks/use-i18n";
import { createShareItem, claimShareItem, deleteShareItem } from "@/lib/share/actions";
import { SHARE_ITEMS } from "@/lib/constants/config";
import { getInitials } from "@/lib/utils";
import type { ShareItemWithProfile } from "@/domain/share-item";

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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handlePost = useCallback(async () => {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);

    const result = await createShareItem(title, description || null);
    setIsSubmitting(false);

    if ("error" in result) {
      setFeedback({ type: "error", message: result.error });
      return;
    }
    setIsFormOpen(false);
    setTitle("");
    setDescription("");
    router.refresh();
  }, [title, description, isSubmitting, router]);

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

  const resetForm = useCallback(() => {
    setIsFormOpen(false);
    setTitle("");
    setDescription("");
  }, []);

  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Create button */}
      {!isFormOpen && !isTeaser && (
        <m.div variants={itemVariants} className="flex justify-end">
          <m.button
            type="button"
            onClick={() => { setIsFormOpen(true); setFeedback(null); }}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="h-12 px-7 rounded-full bg-foreground text-background text-sm font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2.5"
          >
            <Plus size={18} strokeWidth={2.5} />
            {t("share.post")}
          </m.button>
        </m.div>
      )}

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

      {/* Post form */}
      <AnimatePresence>
        {isFormOpen && (
          <m.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="premium-surface rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative">
              {/* Close button */}
              <button
                type="button"
                onClick={resetForm}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>

              {/* Form header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                  <Gift size={22} className="text-brand-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {t("share.createItem")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("share.createHint")}
                  </p>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-6">
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
                    rows={2}
                    className="w-full px-5 py-4 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 focus:bg-background transition-all duration-200 resize-none leading-relaxed"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-12 px-6 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
                  >
                    {t("common.cancel")}
                  </button>
                  <m.button
                    type="button"
                    onClick={handlePost}
                    disabled={!title.trim() || isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-12 px-8 rounded-xl bg-foreground hover:bg-foreground/90 text-background text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isSubmitting ? t("share.posting") : t("share.post")}
                  </m.button>
                </div>
              </div>
            </div>
          </m.section>
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
          {!isTeaser && !isFormOpen && (
            <m.button
              type="button"
              onClick={() => setIsFormOpen(true)}
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
  );
}
