"use client";

import { useState, useCallback, useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { Feather, X, Trash2, MessageCircle, Loader2 } from "lucide-react";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { createBulletin, deleteBulletin, getBulletinsPaginated } from "@/lib/bulletin/actions";
import { BULLETIN } from "@/lib/constants/config";
import { getInitials } from "@/lib/utils";
import { logError } from "@/lib/errors";
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
  /** Cursor for pagination (created_at of the last bulletin) */
  initialCursor?: string | null;
  /** Whether there are more bulletins to load */
  initialHasMore?: boolean;
}

function formatTimestamp(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  // For dates >= 7 days, use localized date format
  if (diffDays >= 7) {
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "narrow" });

  if (diffSecs < 60) {
    return rtf.format(0, "second");
  }
  if (diffMins < 60) {
    return rtf.format(-diffMins, "minute");
  }
  if (diffHours < 24) {
    return rtf.format(-diffHours, "hour");
  }
  return rtf.format(-diffDays, "day");
}

const EASE = [0.23, 1, 0.32, 1] as const;

interface ComposeModalProps {
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

function ComposeModal({ isOpen, onClose, onSubmit, isSubmitting, userProfile }: ComposeModalProps) {
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

              <h2 id={`${id}-title`} className="sr-only">
                {t("bulletin.postMessage")}
              </h2>

              <m.button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.02 } : undefined}
                whileTap={canSubmit ? { scale: 0.98 } : undefined}
                className="h-9 px-5 rounded-full bg-foreground text-background text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {isSubmitting ? t("common.processing") : t("bulletin.post")}
              </m.button>
            </div>

            {/* Compose area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex gap-3">
                {/* User avatar */}
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

                {/* Textarea */}
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

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border/50 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {message.length}/{BULLETIN.maxMessageLength}
                </span>
                <span
                  className={`text-xs font-medium transition-colors ${
                    message.length > BULLETIN.maxMessageLength * 0.9
                      ? "text-error"
                      : "text-muted-foreground"
                  }`}
                >
                  {t("bulletin.maxLength", { max: BULLETIN.maxMessageLength })}
                </span>
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export function BulletinBoard({
  bulletins: initialBulletins,
  currentUserId,
  currentUserProfile,
  isTeaser = false,
  initialCursor = null,
  initialHasMore = false,
}: BulletinBoardProps) {
  const t = useI18n();
  const locale = useLocale();
  const router = useRouter();
  const [bulletins, setBulletins] = useState(initialBulletins);
  const isEditing = !isTeaser;
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Infinite scroll state
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef(false);

  // Intersection observer for infinite scroll
  const [sentinelRef, isIntersecting] = useIntersectionObserver({
    rootMargin: "200px",
    threshold: 0,
  });

  useEffect(() => {
    setBulletins(initialBulletins);
    setCursor(initialCursor);
    setHasMore(initialHasMore);
  }, [initialBulletins, initialCursor, initialHasMore]);

  // Load more bulletins when sentinel is visible
  const loadMore = useCallback(async () => {
    if (loadMoreRef.current || !hasMore || !cursor || isTeaser) return;
    loadMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const result = await getBulletinsPaginated(cursor);
      setBulletins((prev) => [...prev, ...result.bulletins]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (error) {
      logError(error, { action: "loadMoreBulletins" });
    } finally {
      setIsLoadingMore(false);
      loadMoreRef.current = false;
    }
  }, [cursor, hasMore, isTeaser]);

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [isIntersecting, hasMore, isLoadingMore, loadMore]);

  const handlePost = useCallback(async (message: string) => {
    if (!message.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await createBulletin(message);

      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
        return;
      }

      const now = new Date().toISOString();
      const newBulletin: BulletinWithProfile = {
        id: `temp-${Date.now()}`,
        user_id: currentUserId,
        message,
        created_at: now,
        updated_at: now,
        profiles: currentUserProfile ?? null,
      };

      setBulletins((prev) => [newBulletin, ...prev]);
      setIsComposeOpen(false);
      router.refresh();
    } catch (error) {
      logError(error, { action: "handlePost failed" });
      setFeedback({ type: "error", message: t("errors.serverError") });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, router, t, currentUserId, currentUserProfile]);

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
    } catch (error) {
      logError(error, { action: "handleDelete failed" });
      setFeedback({ type: "error", message: t("errors.serverError") });
    } finally {
      setIsSubmitting(false);
    }
  }, [t, router]);

  return (
    <>
      <div className="space-y-1">
        {/* Feedback message */}
        <AnimatePresence>
          {feedback && (
            <m.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className={`text-sm font-medium px-4 py-3 rounded-xl mb-4 ${
                feedback.type === "success"
                  ? "bg-success-bg/50 text-success"
                  : "bg-error-bg/50 text-error"
              }`}
            >
              {feedback.message}
            </m.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {bulletins.length === 0 ? (
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="py-20 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 mb-6 rounded-full bg-muted/60 flex items-center justify-center">
              <MessageCircle size={32} className="text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("bulletin.empty")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t("bulletin.emptyHint")}
            </p>
          </m.div>
        ) : (
          /* Timeline */
          <div className="divide-y divide-border/40">
            {bulletins.map((bulletin, index) => {
              const displayName = bulletin.profiles?.nickname ?? bulletin.profiles?.name ?? t("common.formerResident");
              const isMine = bulletin.user_id === currentUserId;
              const profileHref = bulletin.profiles ? `/profile/${bulletin.user_id}` : undefined;

              return (
                <m.article
                  key={bulletin.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(index * 0.03, 0.3),
                  }}
                  className="py-4 px-1 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    {profileHref ? (
                      <Link href={profileHref} className="shrink-0">
                        <Avatar className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-border/30">
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
                      </Link>
                    ) : (
                      <Avatar className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-border/30 shrink-0">
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
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
                          {profileHref ? (
                            <Link href={profileHref} className="hover:underline shrink-0 max-w-[45%]">
                              <span className="text-[15px] font-bold text-foreground truncate block leading-5">
                                {displayName}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-[15px] font-bold text-foreground truncate shrink-0 max-w-[45%] leading-5">
                              {displayName}
                            </span>
                          )}
                          {bulletin.profiles?.room_number && (
                            <span className="text-sm text-muted-foreground shrink-0 leading-5">
                              · {bulletin.profiles.room_number}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground shrink-0 leading-5">
                            · {formatTimestamp(bulletin.created_at, locale)}
                          </span>
                        </div>

                        {/* Delete button */}
                        {isMine && !bulletin.id.startsWith("temp-") && (
                          <button
                            type="button"
                            onClick={() => handleDelete(bulletin.id)}
                            disabled={isSubmitting}
                            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground/40 hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                            aria-label={t("common.delete")}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      {/* Message */}
                      <p className={`text-[15px] text-foreground leading-relaxed whitespace-pre-wrap break-words ${isTeaser ? "blur-[2.5px] select-none" : ""}`}>
                        {bulletin.message}
                      </p>
                    </div>
                  </div>
                </m.article>
              );
            })}
          </div>
        )}

        {/* Infinite scroll sentinel & loading indicator */}
        {!isTeaser && (
          <div ref={sentinelRef} className="py-6 flex justify-center">
            {isLoadingMore && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">{t("common.loading")}</span>
              </m.div>
            )}
            {!hasMore && bulletins.length > 0 && (
              <p className="text-sm text-muted-foreground/60">
                {t("bulletin.noMorePosts")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      {isEditing && (
        <m.button
          type="button"
          onClick={() => setIsComposeOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 25 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 sm:bottom-8 right-5 sm:right-8 z-40 w-14 h-14 rounded-full bg-foreground text-background shadow-lg shadow-foreground/20 flex items-center justify-center"
          aria-label={t("bulletin.postMessage")}
        >
          <Feather size={22} />
        </m.button>
      )}

      {/* Compose Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSubmit={handlePost}
        isSubmitting={isSubmitting}
        userProfile={currentUserProfile}
      />
    </>
  );
}
