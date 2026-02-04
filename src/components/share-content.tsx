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

export function ShareContent({ items, currentUserId }: ShareContentProps) {
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div />
        {!isFormOpen && (
          <button
            type="button"
            onClick={() => { setIsFormOpen(true); setFeedback(null); }}
            className="text-xs text-white bg-zinc-900 hover:bg-zinc-700 px-3 py-1.5 rounded-md transition-colors"
          >
            {t("share.post")}
          </button>
        )}
      </div>

      <AnimatePresence>
        {feedback && (
          <m.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`text-xs px-3 py-2 mb-4 border-l-2 ${
              feedback.type === "success"
                ? "bg-success-bg border-success-border text-success"
                : "bg-error-bg border-error-border text-error"
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
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-6"
          >
            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  {t("share.titleLabel")}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("share.titlePlaceholder")}
                  maxLength={SHARE_ITEMS.maxTitleLength}
                  className="w-full h-10 px-3 text-sm text-zinc-900 placeholder:text-zinc-300 border border-zinc-200 rounded-md focus:border-zinc-900 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  {t("share.descriptionLabel")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("share.descriptionPlaceholder")}
                  maxLength={SHARE_ITEMS.maxDescriptionLength}
                  rows={2}
                  className="w-full px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-300 border border-zinc-200 rounded-md focus:border-zinc-900 focus:outline-none resize-none transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setTitle(""); setDescription(""); }}
                  className="text-xs text-zinc-400 hover:text-zinc-600 px-3 py-1.5 transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={!title.trim() || isSubmitting}
                  className="text-xs text-white bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-300 px-3 py-1.5 rounded-md transition-colors"
                >
                  {isSubmitting ? t("share.posting") : t("share.post")}
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <p className="text-xs text-zinc-400 py-8 text-center">{t("share.empty")}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const displayName = item.profiles?.nickname || item.profiles?.name || "";
            const isMine = item.user_id === currentUserId;
            const isClaimed = item.status === "claimed";
            const timeLeft = formatTimeRemaining(item.expires_at);

            return (
              <m.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={`border rounded-lg p-4 ${
                  isClaimed
                    ? "border-zinc-100 bg-zinc-50"
                    : "border-zinc-200"
                }`}
              >
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 rounded-full shrink-0">
                    <OptimizedAvatarImage
                      src={item.profiles?.avatar_url}
                      alt={displayName}
                      context="card"
                      fallback={
                        <span className="text-[10px] text-zinc-400">
                          {getInitials(displayName)}
                        </span>
                      }
                      fallbackClassName="bg-zinc-50"
                    />
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500">{displayName}</span>
                      {item.profiles?.room_number && (
                        <span className="text-[10px] text-zinc-300">
                          {item.profiles.room_number}
                        </span>
                      )}
                      {timeLeft && !isClaimed && (
                        <span className="text-[10px] text-zinc-400 ml-auto">
                          {t("share.expiresIn", { time: timeLeft })}
                        </span>
                      )}
                    </div>

                    <p className={`text-sm font-medium ${isClaimed ? "text-zinc-400" : "text-zinc-900"}`}>
                      {item.title}
                    </p>

                    {item.description && (
                      <p className={`text-xs mt-1 ${isClaimed ? "text-zinc-300" : "text-zinc-500"}`}>
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      {isClaimed ? (
                        <span className="text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                          {t("share.claimed")}
                        </span>
                      ) : !isMine ? (
                        <button
                          type="button"
                          onClick={() => handleClaim(item.id)}
                          disabled={isSubmitting}
                          className="text-xs text-white bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-300 px-3 py-1 rounded-md transition-colors"
                        >
                          {t("share.claim")}
                        </button>
                      ) : null}

                      {isMine && !isClaimed && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={isSubmitting}
                          className="text-[10px] text-zinc-300 hover:text-zinc-500 transition-colors ml-auto"
                        >
                          {t("common.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </m.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
