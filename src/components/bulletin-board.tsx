"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Feather, MessageCircle } from "lucide-react";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { createBulletin, deleteBulletin, updateBulletin, getBulletinsPaginated } from "@/lib/bulletin/actions";
import { logError } from "@/lib/errors";
import { BulletinItem, BulletinSkeleton, ComposeModal, SPRING, SPRING_SOFT, EASE_OUT } from "@/components/bulletin";
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
