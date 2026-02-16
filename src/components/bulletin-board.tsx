"use client";

import { useState, useCallback, useEffect, useId, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { Feather, X, Trash2, MessageCircle } from "lucide-react";
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
  initialCursor?: string | null;
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

  if (diffDays >= 7) {
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "narrow" });

  if (diffSecs < 60) return rtf.format(0, "second");
  if (diffMins < 60) return rtf.format(-diffMins, "minute");
  if (diffHours < 24) return rtf.format(-diffHours, "hour");
  return rtf.format(-diffDays, "day");
}

// Twitter-like spring physics
const SPRING = { type: "spring", stiffness: 500, damping: 30, mass: 1 } as const;
const SPRING_SOFT = { type: "spring", stiffness: 300, damping: 25 } as const;
const EASE_OUT = [0.32, 0.72, 0, 1] as const;

// Skeleton loader component
function BulletinSkeleton() {
  return (
    <div className="py-4 px-1 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-12 bg-muted/60 rounded" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-full bg-muted/80 rounded" />
            <div className="h-4 w-3/4 bg-muted/60 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual bulletin item with Twitter-like animations
interface BulletinItemProps {
  bulletin: BulletinWithProfile;
  currentUserId: string;
  isTeaser: boolean;
  isNew: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  locale: string;
}

function BulletinItem({
  bulletin,
  currentUserId,
  isTeaser,
  isNew,
  onDelete,
  isDeleting,
  locale,
}: BulletinItemProps) {
  const t = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const displayName = bulletin.profiles?.nickname ?? bulletin.profiles?.name ?? t("common.formerResident");
  const isMine = bulletin.user_id === currentUserId;
  const profileHref = bulletin.profiles ? `/profile/${bulletin.user_id}` : undefined;

  return (
    <m.article
      layout={!shouldReduceMotion}
      initial={isNew ? { opacity: 0, y: -20, scale: 0.95 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={isNew ? SPRING : { duration: 0.2 }}
      className="py-4 px-1 hover:bg-muted/30 transition-colors group border-b border-border/40 last:border-b-0"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        {profileHref ? (
          <Link href={profileHref} className="shrink-0">
            <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
            </m.div>
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

            {/* Delete button with smooth reveal */}
            {isMine && !bulletin.id.startsWith("temp-") && (
              <m.button
                type="button"
                onClick={() => onDelete(bulletin.id)}
                disabled={isDeleting}
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                whileTap={{ scale: 0.9 }}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground/40 hover:text-error opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                aria-label={t("common.delete")}
              >
                <Trash2 size={15} />
              </m.button>
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
}

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

  // Track newly added bulletin IDs for special animation
  const [newBulletinIds, setNewBulletinIds] = useState<Set<string>>(new Set());

  // Infinite scroll state
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef(false);

  // Intersection observer for infinite scroll
  const [sentinelRef, isIntersecting] = useIntersectionObserver({
    rootMargin: "400px", // Load earlier for smoother experience
    threshold: 0,
  });

  // Track which bulletins were just loaded for staggered animation
  const [loadedBatch, setLoadedBatch] = useState<Set<string>>(new Set());

  useEffect(() => {
    setBulletins(initialBulletins);
    setCursor(initialCursor);
    setHasMore(initialHasMore);
  }, [initialBulletins, initialCursor, initialHasMore]);

  // Load more bulletins
  const loadMore = useCallback(async () => {
    if (loadMoreRef.current || !hasMore || !cursor || isTeaser) return;
    loadMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const result = await getBulletinsPaginated(cursor);
      const newIds = new Set(result.bulletins.map(b => b.id));
      setLoadedBatch(newIds);

      setBulletins((prev) => [...prev, ...result.bulletins]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);

      // Clear loaded batch after animation
      setTimeout(() => setLoadedBatch(new Set()), 500);
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
      const newId = `temp-${Date.now()}`;
      const newBulletin: BulletinWithProfile = {
        id: newId,
        user_id: currentUserId,
        message,
        created_at: now,
        updated_at: now,
        profiles: currentUserProfile ?? null,
      };

      // Mark as new for special animation
      setNewBulletinIds((prev) => new Set([...prev, newId]));
      setBulletins((prev) => [newBulletin, ...prev]);
      setIsComposeOpen(false);

      // Clear new status after animation
      setTimeout(() => {
        setNewBulletinIds((prev) => {
          const next = new Set(prev);
          next.delete(newId);
          return next;
        });
      }, 600);

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

  // Calculate stagger delay for loaded items
  const getStaggerDelay = useCallback((bulletinId: string, index: number) => {
    if (loadedBatch.has(bulletinId)) {
      const batchIndex = Array.from(loadedBatch).indexOf(bulletinId);
      return batchIndex * 0.05; // 50ms stagger
    }
    return 0;
  }, [loadedBatch]);

  return (
    <>
      <div className="space-y-1">
        {/* Feedback message */}
        <AnimatePresence mode="wait">
          {feedback && (
            <m.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={SPRING_SOFT}
              className={`text-sm font-medium px-4 py-3 rounded-xl mb-4 overflow-hidden ${
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
        {bulletins.length === 0 && !isLoadingMore ? (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="py-20 flex flex-col items-center text-center"
          >
            <m.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...SPRING, delay: 0.1 }}
              className="w-20 h-20 mb-6 rounded-full bg-muted/60 flex items-center justify-center"
            >
              <MessageCircle size={32} className="text-muted-foreground/40" />
            </m.div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("bulletin.empty")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t("bulletin.emptyHint")}
            </p>
          </m.div>
        ) : (
          /* Timeline */
          <div>
            <AnimatePresence initial={false} mode="popLayout">
              {bulletins.map((bulletin, index) => (
                <m.div
                  key={bulletin.id}
                  initial={loadedBatch.has(bulletin.id) ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    ...SPRING_SOFT,
                    delay: getStaggerDelay(bulletin.id, index),
                  }}
                >
                  <BulletinItem
                    bulletin={bulletin}
                    currentUserId={currentUserId}
                    isTeaser={isTeaser}
                    isNew={newBulletinIds.has(bulletin.id)}
                    onDelete={handleDelete}
                    isDeleting={isSubmitting}
                    locale={locale}
                  />
                </m.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Loading skeletons */}
        <AnimatePresence>
          {isLoadingMore && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {[...Array(3)].map((_, i) => (
                <m.div
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <BulletinSkeleton />
                </m.div>
              ))}
            </m.div>
          )}
        </AnimatePresence>

        {/* Infinite scroll sentinel */}
        {!isTeaser && (
          <div ref={sentinelRef} className="py-4">
            {!hasMore && bulletins.length > 0 && (
              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground/60 text-center"
              >
                {t("bulletin.noMorePosts")}
              </m.p>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {isEditing && (
        <m.button
          type="button"
          onClick={() => setIsComposeOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={SPRING}
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
