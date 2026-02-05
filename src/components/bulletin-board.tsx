"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/hooks/use-i18n";
import { upsertBulletin, deleteBulletin } from "@/lib/bulletin/actions";
import { BULLETIN } from "@/lib/constants/config";
import { getInitials } from "@/lib/utils";
import type { BulletinWithProfile } from "@/domain/bulletin";

interface BulletinBoardProps {
  bulletins: BulletinWithProfile[];
  currentUserId: string;
  isTeaser?: boolean;
}

function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export function BulletinBoard({ bulletins, currentUserId, isTeaser = false }: BulletinBoardProps) {
  const t = useI18n();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const myBulletin = bulletins.find((b) => b.user_id === currentUserId);

  const handlePost = useCallback(async () => {
    if (!message.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await upsertBulletin(message);

      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
        return;
      }
      setIsEditing(false);
      setMessage("");
      router.refresh();
    } catch {
      setFeedback({ type: "error", message: t("errors.serverError") });
    } finally {
      setIsSubmitting(false);
    }
  }, [message, isSubmitting, router, t]);

  const handleDelete = useCallback(async () => {
    if (!confirm(t("bulletin.deleteConfirm"))) return;
    setIsSubmitting(true);

    try {
      const result = await deleteBulletin();

      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
      } else {
        router.refresh();
      }
    } catch {
      setFeedback({ type: "error", message: t("errors.serverError") });
    } finally {
      setIsSubmitting(false);
    }
  }, [t, router]);

  const handleStartEdit = useCallback(() => {
    setMessage(myBulletin?.message || "");
    setIsEditing(true);
    setFeedback(null);
  }, [myBulletin]);

  return (
    <div className="space-y-6">
      {!isEditing && !isTeaser && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleStartEdit}
            className="h-9 px-5 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold tracking-wider uppercase transition-all duration-300 shadow-sm shadow-brand-100"
          >
            {myBulletin ? t("bulletin.update") : t("bulletin.post")}
          </button>
        </div>
      )}

      <AnimatePresence>
        {feedback && (
          <m.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`text-xs font-medium px-4 py-3 rounded-xl border-l-4 shadow-sm ${feedback.type === "success"
              ? "bg-success-bg/50 border-success-border text-success"
              : "bg-error-bg/50 border-error-border text-error"
              }`}
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
            <div className="premium-surface rounded-3xl p-6 sm:p-8 space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("bulletin.placeholder")}
                maxLength={BULLETIN.maxMessageLength}
                rows={3}
                className="w-full text-[15px] font-medium text-slate-700 placeholder:text-slate-300 bg-transparent resize-none focus:outline-none"
              />
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-300 tracking-widest">
                  {message.length}/{BULLETIN.maxMessageLength}
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setMessage(""); }}
                    className="h-9 px-5 rounded-full text-[11px] font-bold text-slate-400 hover:text-slate-600 tracking-wider uppercase transition-all duration-300"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handlePost}
                    disabled={!message.trim() || isSubmitting}
                    className="h-9 px-7 rounded-full bg-brand-600 hover:bg-brand-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-[11px] font-bold tracking-wider uppercase transition-all duration-300 shadow-sm shadow-brand-100"
                  >
                    {isSubmitting ? t("common.processing") : t("bulletin.post")}
                  </button>
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {bulletins.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-400 font-medium">{t("bulletin.empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bulletins.map((bulletin, index) => {
            const displayName = bulletin.profiles?.nickname || bulletin.profiles?.name || "";
            const isMine = bulletin.user_id === currentUserId;

            return (
              <m.div
                key={bulletin.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
                className="premium-surface rounded-2xl p-5 sm:p-6 flex gap-4 group relative"
              >
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border border-slate-100 shadow-sm shrink-0 overflow-hidden">
                  <OptimizedAvatarImage
                    src={bulletin.profiles?.avatar_url}
                    alt={displayName}
                    context="card"
                    isBlurred={isTeaser}
                    fallback={
                      <span className="text-[11px] font-bold text-slate-400">
                        {getInitials(displayName)}
                      </span>
                    }
                    fallbackClassName="bg-slate-50"
                  />
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900 truncate tracking-tight">
                      {displayName}
                    </span>
                    {bulletin.profiles?.room_number && (
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                        #{bulletin.profiles.room_number}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-300 tracking-tight ml-auto">
                      {formatTimeAgo(bulletin.updated_at)}
                    </span>
                  </div>
                  <p className={`text-[15px] font-medium text-slate-600 leading-relaxed ${isTeaser ? "blur-[2.5px] select-none" : ""}`}>
                    {bulletin.message}
                  </p>
                </div>

                {isMine && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="absolute top-4 right-4 text-[10px] font-bold text-slate-200 hover:text-error opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest p-2"
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
