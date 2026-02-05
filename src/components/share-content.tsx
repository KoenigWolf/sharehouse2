"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
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

  return (
    <div className="space-y-8">
      {!isFormOpen && !isTeaser && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { setIsFormOpen(true); setFeedback(null); }}
            className="h-9 px-5 rounded-full bg-brand-500 hover:bg-brand-700 text-white text-[11px] font-bold tracking-wider uppercase transition-all duration-300 shadow-sm shadow-brand-100"
          >
            {t("share.post")}
          </button>
        </div>
      )}

      <AnimatePresence>
        {feedback && (
          <m.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
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
        {isFormOpen && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="premium-surface rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                  {t("share.titleLabel")}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("share.titlePlaceholder")}
                  maxLength={SHARE_ITEMS.maxTitleLength}
                  className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                  {t("share.descriptionLabel")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("share.descriptionPlaceholder")}
                  maxLength={SHARE_ITEMS.maxDescriptionLength}
                  rows={2}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all duration-300 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setTitle(""); setDescription(""); }}
                  className="h-10 px-6 rounded-full text-[11px] font-bold text-slate-400 hover:text-slate-600 tracking-wider uppercase transition-all duration-300"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={!title.trim() || isSubmitting}
                  className="h-10 px-8 rounded-full bg-brand-500 hover:bg-brand-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-[11px] font-bold tracking-wider uppercase transition-all duration-300 shadow-sm shadow-brand-100"
                >
                  {isSubmitting ? t("share.posting") : t("share.post")}
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-slate-400 font-medium">{t("share.empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item, index) => {
            const displayName = item.profiles?.nickname ?? item.profiles?.name ?? "";
            const isMine = item.user_id === currentUserId;
            const isClaimed = item.status === "claimed";
            const timeLeft = formatTimeRemaining(item.expires_at);

            return (
              <m.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: index * 0.05 }}
                className={`premium-surface rounded-3xl p-6 relative group flex flex-col ${isClaimed ? "opacity-60 grayscale-[0.5]" : ""
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="w-6 h-6 rounded-lg border border-slate-100 shadow-sm overflow-hidden">
                      <OptimizedAvatarImage
                        src={item.profiles?.avatar_url}
                        alt={displayName}
                        context="card"
                        isBlurred={isTeaser}
                        fallback={
                          <span className="text-[9px] font-bold text-slate-400">
                            {getInitials(displayName)}
                          </span>
                        }
                        fallbackClassName="bg-slate-50"
                      />
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-900 tracking-tight leading-none mb-0.5">
                        {displayName}
                      </span>
                      {item.profiles?.room_number && (
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider">
                          #{item.profiles.room_number}
                        </span>
                      )}
                    </div>
                  </div>
                  {timeLeft && !isClaimed && (
                    <span className="text-[10px] font-bold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full tracking-wider">
                      {timeLeft}
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-6 flex-1">
                  <h4 className={`text-base font-bold tracking-tight ${isTeaser ? "blur-[2.5px] select-none" : isClaimed ? "text-slate-400 line-through" : "text-slate-900"}`}>
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className={`text-sm font-medium leading-relaxed ${isTeaser ? "blur-[3px] select-none" : isClaimed ? "text-slate-300" : "text-slate-500"}`}>
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto">
                  {isClaimed ? (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
                      {t("share.claimed")}
                    </span>
                  ) : !isMine ? (
                    <button
                      type="button"
                      onClick={() => !isTeaser && handleClaim(item.id)}
                      disabled={isSubmitting || isTeaser}
                      className={`h-8 px-6 rounded-full bg-brand-500 hover:bg-brand-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-[10px] font-bold tracking-wider uppercase transition-all duration-300 shadow-sm shadow-brand-100 ${isTeaser ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {t("share.claim")}
                    </button>
                  ) : (
                    <div />
                  )}

                  {isMine && !isClaimed && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={isSubmitting}
                      className="text-[10px] font-bold text-slate-300 hover:text-rose-500 uppercase tracking-widest transition-all p-2"
                    >
                      {t("common.delete")}
                    </button>
                  )}
                </div>
              </m.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
