"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
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

export function BulletinBoard({ bulletins: initialBulletins, currentUserId, currentUserProfile, isTeaser = false }: BulletinBoardProps) {
  const t = useI18n();
  const locale = useLocale();
  const router = useRouter();
  const [bulletins, setBulletins] = useState(initialBulletins);
  const isEditing = !isTeaser;
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Sync with server data
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

      // Optimistic update: add new bulletin to the top
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
    // temp ID（楽観的更新中）の場合は削除をスキップ
    if (bulletinId.startsWith("temp-")) return;

    if (!confirm(t("bulletin.deleteConfirm"))) return;
    setIsSubmitting(true);

    try {
      const result = await deleteBulletin(bulletinId);

      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
      } else {
        // Optimistic update: remove the bulletin
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
    <div className="space-y-6">
      <AnimatePresence>
        {feedback && (
          <m.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`text-xs font-medium shadow-sm ${feedback.type === "success" ? "alert-success" : "alert-error"}`}
          >
            {feedback.message}
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditing && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="card-base p-5 sm:p-6 space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("bulletin.placeholder")}
                maxLength={BULLETIN.maxMessageLength}
                rows={3}
                className="w-full text-[15px] font-medium text-foreground/90 placeholder:text-muted-foreground/70 bg-transparent resize-none focus:outline-none"
              />
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-[10px] font-bold text-muted-foreground/70 tracking-widest">
                  {message.length}/{BULLETIN.maxMessageLength}
                </span>
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={!message.trim() || isSubmitting}
                  className="h-9 px-7 rounded-full bg-brand-500 hover:bg-brand-700 disabled:bg-secondary disabled:text-muted-foreground text-white text-[11px] font-bold tracking-wider uppercase transition-all duration-300 shadow-sm shadow-brand-100"
                >
                  {isSubmitting ? t("common.processing") : t("bulletin.post")}
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {bulletins.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground font-medium">{t("bulletin.empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bulletins.map((bulletin, index) => {
            const displayName = bulletin.profiles?.nickname ?? bulletin.profiles?.name ?? "";
            const isMine = bulletin.user_id === currentUserId;

            return (
              <m.div
                key={bulletin.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
                className="card-base p-5 sm:p-6 flex gap-4 group relative"
              >
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border border-border shadow-sm shrink-0 overflow-hidden">
                  <OptimizedAvatarImage
                    src={bulletin.profiles?.avatar_url}
                    alt={displayName}
                    context="card"
                    isBlurred={isTeaser}
                    fallback={
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {getInitials(displayName)}
                      </span>
                    }
                    fallbackClassName="bg-muted"
                  />
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground truncate tracking-tight">
                      {displayName}
                    </span>
                    {bulletin.profiles?.room_number && (
                      <span className="text-[10px] font-bold text-muted-foreground tracking-wider">
                        #{bulletin.profiles.room_number}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-muted-foreground/70 tracking-tight ml-auto">
                      {formatTimestamp(bulletin.created_at, locale)}
                    </span>
                  </div>
                  <p className={`text-[15px] font-medium text-foreground/80 leading-relaxed ${isTeaser ? "blur-[2.5px] select-none" : ""}`}>
                    {bulletin.message}
                  </p>
                </div>

                {isMine && !bulletin.id.startsWith("temp-") && (
                  <button
                    type="button"
                    onClick={() => handleDelete(bulletin.id)}
                    disabled={isSubmitting}
                    className="absolute top-4 right-4 text-[10px] font-bold text-muted-foreground/40 hover:text-error opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest p-2"
                  >
                    {t("common.delete")}
                  </button>
                )}
              </m.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
