"use client";

import { useState, useCallback, useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { Feather, X, Trash2, MessageCircle, Pencil, Check } from "lucide-react";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { createBulletin, deleteBulletin, updateBulletin, getBulletinsPaginated } from "@/lib/bulletin/actions";
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
  onEdit: (id: string, message: string) => Promise<boolean>;
  isDeleting: boolean;
  locale: string;
}

function BulletinItem({
  bulletin,
  currentUserId,
  isTeaser,
  isNew,
  onDelete,
  onEdit,
  isDeleting,
  locale,
}: BulletinItemProps) {
  const t = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayName = bulletin.profiles?.nickname ?? bulletin.profiles?.name ?? t("common.formerResident");
  const isMine = bulletin.user_id === currentUserId;
  const profileHref = bulletin.profiles ? `/profile/${bulletin.user_id}` : undefined;

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState(bulletin.message);
  const [isSaving, setIsSaving] = useState(false);

  // Check if message was edited
  const isEdited = bulletin.updated_at && bulletin.updated_at !== bulletin.created_at;

  // Start editing
  const handleStartEdit = useCallback(() => {
    setEditMessage(bulletin.message);
    setIsEditing(true);
  }, [bulletin.message]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditMessage(bulletin.message);
    setIsEditing(false);
  }, [bulletin.message]);

  // Save edit
  const handleSaveEdit = useCallback(async () => {
    const trimmed = editMessage.trim();
    if (!trimmed || trimmed === bulletin.message) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const success = await onEdit(bulletin.id, trimmed);
    setIsSaving(false);

    if (success) {
      setIsEditing(false);
    }
  }, [editMessage, bulletin.id, bulletin.message, onEdit]);

  // Auto-focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancelEdit();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveEdit();
    }
  }, [handleCancelEdit, handleSaveEdit]);

  const charCount = editMessage.length;
  const isOverLimit = charCount > BULLETIN.maxMessageLength;
  const canSave = editMessage.trim() && editMessage.trim() !== bulletin.message && !isOverLimit;

  return (
    <m.article
      layout={!shouldReduceMotion}
      initial={isNew ? { opacity: 0, y: -20, scale: 0.95 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={isNew ? SPRING : { duration: 0.2 }}
      className={`py-4 px-1 transition-colors group border-b border-border/40 last:border-b-0 ${isEditing ? "bg-muted/20" : "hover:bg-muted/30"}`}
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
              <span className="min-w-0 truncate text-sm text-muted-foreground leading-5">
                {bulletin.profiles?.room_number && `· ${bulletin.profiles.room_number} `}
                · {formatTimestamp(bulletin.created_at, locale)}
                {isEdited && !isEditing && (
                  <span className="ml-1 text-xs text-muted-foreground/60">({t("bulletin.edited")})</span>
                )}
              </span>
            </div>

            {/* Action buttons */}
            {isMine && !bulletin.id.startsWith("temp-") && !isEditing && (
              <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {/* Edit button */}
                <m.button
                  type="button"
                  onClick={handleStartEdit}
                  disabled={isDeleting || isSaving}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-blue-500 focus:opacity-100 transition-opacity"
                  aria-label={t("bulletin.edit")}
                >
                  <Pencil size={14} />
                </m.button>

                {/* Delete button */}
                <m.button
                  type="button"
                  onClick={() => onDelete(bulletin.id)}
                  disabled={isDeleting}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-error focus:opacity-100 transition-opacity"
                  aria-label={t("common.delete")}
                >
                  <Trash2 size={15} />
                </m.button>
              </div>
            )}
          </div>

          {/* Message or Edit form */}
          <AnimatePresence mode="wait">
            {isEditing ? (
              <m.div
                key="edit-form"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="space-y-3"
              >
                {/* Textarea */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    maxLength={BULLETIN.maxMessageLength}
                    rows={3}
                    className={`w-full px-3 py-2.5 bg-card border rounded-xl text-[15px] text-foreground leading-relaxed resize-none focus:outline-none focus:ring-2 transition-all ${
                      isOverLimit
                        ? "border-error focus:ring-error/20"
                        : "border-border focus:ring-brand-500/20 focus:border-brand-500/50"
                    }`}
                    placeholder={t("bulletin.placeholderVibe")}
                  />
                </div>

                {/* Footer: Character count + Actions */}
                <div className="flex items-center justify-between">
                  {/* Character counter with circular progress */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6">
                      <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-muted/30"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className={isOverLimit ? "text-error" : charCount > BULLETIN.maxMessageLength * 0.9 ? "text-amber-500" : "text-brand-500"}
                          style={{
                            strokeDasharray: 62.83,
                            strokeDashoffset: 62.83 - (Math.min(charCount / BULLETIN.maxMessageLength, 1) * 62.83),
                          }}
                        />
                      </svg>
                    </div>
                    <span className={`text-xs font-medium ${isOverLimit ? "text-error" : "text-muted-foreground"}`}>
                      {charCount}/{BULLETIN.maxMessageLength}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <m.button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="h-8 px-3 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {t("bulletin.editCancel")}
                    </m.button>
                    <m.button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={!canSave || isSaving}
                      whileHover={canSave ? { scale: 1.02 } : undefined}
                      whileTap={canSave ? { scale: 0.98 } : undefined}
                      className="h-8 px-4 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {isSaving ? (
                        t("bulletin.saving")
                      ) : (
                        <>
                          <Check size={14} />
                          {t("bulletin.editConfirm")}
                        </>
                      )}
                    </m.button>
                  </div>
                </div>
              </m.div>
            ) : (
              <m.p
                key="message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={`text-[15px] text-foreground leading-relaxed whitespace-pre-wrap break-words ${isTeaser ? "blur-[2.5px] select-none" : ""}`}
              >
                {bulletin.message}
              </m.p>
            )}
          </AnimatePresence>
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

  const handleEdit = useCallback(async (bulletinId: string, message: string): Promise<boolean> => {
    try {
      const result = await updateBulletin(bulletinId, message);

      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
        return false;
      }

      // Update local state with new message
      setBulletins((prev) =>
        prev.map((b) =>
          b.id === bulletinId
            ? { ...b, message, updated_at: new Date().toISOString() }
            : b
        )
      );
      router.refresh();
      return true;
    } catch (error) {
      logError(error, { action: "handleEdit failed" });
      setFeedback({ type: "error", message: t("errors.serverError") });
      return false;
    }
  }, [t, router]);

  // Calculate stagger delay for loaded items
  const getStaggerDelay = useCallback((bulletinId: string) => {
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
              {bulletins.map((bulletin) => (
                <m.div
                  key={bulletin.id}
                  initial={loadedBatch.has(bulletin.id) ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    ...SPRING_SOFT,
                    delay: getStaggerDelay(bulletin.id),
                  }}
                >
                  <BulletinItem
                    bulletin={bulletin}
                    currentUserId={currentUserId}
                    isTeaser={isTeaser}
                    isNew={newBulletinIds.has(bulletin.id)}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
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
