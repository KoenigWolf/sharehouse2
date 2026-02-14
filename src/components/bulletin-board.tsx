"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { createBulletin, deleteBulletin } from "@/lib/bulletin/actions";
import { BULLETIN } from "@/lib/constants/config";
import { getInitials } from "@/lib/utils";
import type { BulletinWithProfile } from "@/domain/bulletin";

interface BulletinBoardProps {
  bulletins: BulletinWithProfile[];
  currentUserId: string;
  currentUserProfile?: {
    name: string;
    nickname: string | null;
    avatar_url: string | null;
    room_number: string | null;
  };
  isTeaser?: boolean;
}

function formatTimestamp(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
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

export function BulletinBoard({ bulletins: initialBulletins, currentUserId, currentUserProfile, isTeaser = false }: BulletinBoardProps) {
  const t = useI18n();
  const locale = useLocale();
  const router = useRouter();
  const [bulletins, setBulletins] = useState(initialBulletins);
  const isEditing = !isTeaser;
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setBulletins(initialBulletins);
  }, [initialBulletins]);

  const handlePost = useCallback(async () => {
    if (!message.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);

    const trimmedMessage = message.trim();

    try {
      const result = await createBulletin(trimmedMessage);

      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
        return;
      }

      const now = new Date().toISOString();
      const newBulletin: BulletinWithProfile = {
        id: `temp-${Date.now()}`,
        user_id: currentUserId,
        message: trimmedMessage,
        created_at: now,
        updated_at: now,
        profiles: currentUserProfile ?? null,
      };

      setBulletins((prev) => [newBulletin, ...prev]);
      setMessage("");
      router.refresh();
    } catch {
      setFeedback({ type: "error", message: t("errors.serverError") });
    } finally {
      setIsSubmitting(false);
    }
  }, [message, isSubmitting, router, t, currentUserId, currentUserProfile]);

  const handleDelete = useCallback(async (bulletinId: string) => {
    if (bulletinId.startsWith("temp-")) return;
    if (!confirm(t("bulletin.deleteConfirm"))) return;
    setIsSubmitting(true);

    try {
      const result = await deleteBulletin(bulletinId);

      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setBulletins((prev) => prev.filter((b) => b.id !== bulletinId));
        router.refresh();
      }
    } catch {
      setFeedback({ type: "error", message: t("errors.serverError") });
    } finally {
      setIsSubmitting(false);
    }
  }, [t, router]);

  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Feedback message */}
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
        {isEditing && (
          <m.div
            variants={itemVariants}
            className="premium-surface rounded-2xl overflow-hidden"
          >
            {/* Form header */}
            <div className="flex items-center gap-3 px-5 sm:px-6 pt-5 pb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                <MessageCircle size={18} className="text-brand-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t("bulletin.postMessage")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("bulletin.postHint")}
                </p>
              </div>
            </div>

            {/* Textarea */}
            <div className="px-5 sm:px-6 pb-5">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("bulletin.placeholder")}
                maxLength={BULLETIN.maxMessageLength}
                rows={3}
                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 focus:bg-background transition-all duration-200 resize-none leading-relaxed"
              />

              {/* Actions */}
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {message.length}/{BULLETIN.maxMessageLength}
                </span>
                <m.button
                  type="button"
                  onClick={handlePost}
                  disabled={!message.trim() || isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-11 px-6 rounded-xl bg-foreground text-background text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send size={16} />
                  {isSubmitting ? t("common.processing") : t("bulletin.post")}
                </m.button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {bulletins.length === 0 ? (
        <m.div
          variants={itemVariants}
          className="py-20 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 mb-8 rounded-2xl bg-muted/80 flex items-center justify-center">
            <MessageCircle size={32} className="text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {t("bulletin.empty")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {t("bulletin.emptyHint")}
          </p>
        </m.div>
      ) : (
        /* Bulletin list */
        <div className="space-y-4">
          {bulletins.map((bulletin, index) => {
            const displayName = bulletin.profiles?.nickname ?? bulletin.profiles?.name ?? t("common.formerResident");
            const isMine = bulletin.user_id === currentUserId;

            return (
              <m.article
                key={bulletin.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.04,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="premium-surface rounded-2xl p-5 sm:p-6 group relative"
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <Avatar className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl border border-border/50 shrink-0">
                    <OptimizedAvatarImage
                      src={bulletin.profiles?.avatar_url}
                      alt={displayName}
                      context="card"
                      isBlurred={isTeaser}
                      fallback={
                        <span className="text-xs font-semibold text-muted-foreground">
                          {getInitials(displayName)}
                        </span>
                      }
                      fallbackClassName="bg-muted"
                    />
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {displayName}
                      </span>
                      {bulletin.profiles?.room_number && (
                        <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                          {bulletin.profiles.room_number}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground/60 ml-auto shrink-0">
                        {formatTimestamp(bulletin.created_at, locale)}
                      </span>
                    </div>

                    {/* Message */}
                    <p className={`text-sm text-foreground/80 leading-relaxed ${isTeaser ? "blur-[2.5px] select-none" : ""}`}>
                      {bulletin.message}
                    </p>
                  </div>
                </div>

                {/* Delete button */}
                {isMine && !bulletin.id.startsWith("temp-") && (
                  <button
                    type="button"
                    onClick={() => handleDelete(bulletin.id)}
                    disabled={isSubmitting}
                    className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label={t("common.delete")}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </m.article>
            );
          })}
        </div>
      )}
    </m.div>
  );
}
