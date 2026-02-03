"use client";

import { useState, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Gift, Calendar } from "lucide-react";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/hooks/use-i18n";
import { upsertBulletin, deleteBulletin } from "@/lib/bulletin/actions";
import { BULLETIN } from "@/lib/constants/config";
import { getInitials } from "@/lib/utils";
import type { BulletinWithProfile } from "@/domain/bulletin";

interface BulletinBoardProps {
  bulletins: BulletinWithProfile[];
  currentUserId: string;
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

export function BulletinBoard({ bulletins, currentUserId }: BulletinBoardProps) {
  const t = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const myBulletin = bulletins.find((b) => b.user_id === currentUserId);

  const handlePost = useCallback(async () => {
    if (!message.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);

    const result = await upsertBulletin(message);
    setIsSubmitting(false);

    if ("error" in result) {
      setFeedback({ type: "error", message: result.error });
      return;
    }
    setIsEditing(false);
    setMessage("");
  }, [message, isSubmitting]);

  const handleDelete = useCallback(async () => {
    if (!confirm(t("bulletin.deleteConfirm"))) return;
    setIsSubmitting(true);

    const result = await deleteBulletin();
    setIsSubmitting(false);

    if ("error" in result) {
      setFeedback({ type: "error", message: result.error });
    }
  }, [t]);

  const handleStartEdit = useCallback(() => {
    setMessage(myBulletin?.message || "");
    setIsEditing(true);
    setFeedback(null);
  }, [myBulletin]);

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-zinc-900">{t("bulletin.title")}</h2>
        {!isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {myBulletin ? t("bulletin.update") : t("bulletin.post")}
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
            className={`text-xs px-3 py-2 mb-3 border-l-2 ${
              feedback.type === "success"
                ? "bg-[#f0fdf4] border-[#93c5a0] text-[#3d6b4a]"
                : "bg-[#fef2f2] border-[#e5a0a0] text-[#8b4040]"
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
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-4"
          >
            <div className="border border-zinc-200 rounded-lg p-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("bulletin.placeholder")}
                maxLength={BULLETIN.maxMessageLength}
                rows={2}
                className="w-full text-sm text-zinc-900 placeholder:text-zinc-300 bg-transparent resize-none outline-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-zinc-400">
                  {message.length}/{BULLETIN.maxMessageLength}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setMessage(""); }}
                    className="text-xs text-zinc-400 hover:text-zinc-600 px-3 py-1.5 transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handlePost}
                    disabled={!message.trim() || isSubmitting}
                    className="text-xs text-white bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-300 px-3 py-1.5 rounded-md transition-colors"
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
        <p className="text-xs text-zinc-400 py-4">{t("bulletin.empty")}</p>
      ) : (
        <div className="space-y-3">
          {bulletins.map((bulletin) => {
            const displayName = bulletin.profiles?.nickname || bulletin.profiles?.name || "";
            const isMine = bulletin.user_id === currentUserId;

            return (
              <m.div
                key={bulletin.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex gap-3 group"
              >
                <Avatar className="w-8 h-8 rounded-full shrink-0">
                  <OptimizedAvatarImage
                    src={bulletin.profiles?.avatar_url}
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-900 truncate">
                      {displayName}
                    </span>
                    {bulletin.profiles?.room_number && (
                      <span className="text-[10px] text-zinc-400">
                        {bulletin.profiles.room_number}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-300">
                      {formatTimeAgo(bulletin.updated_at)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 mt-0.5 leading-relaxed">
                    {bulletin.message}
                  </p>
                </div>

                {isMine && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="text-[10px] text-zinc-300 hover:text-zinc-500 opacity-0 group-hover:opacity-100 transition-all self-start pt-0.5"
                  >
                    {t("common.delete")}
                  </button>
                )}
              </m.div>
            );
          })}
        </div>
      )}

      <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-100">
        <Link
          href="/share"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <Gift size={14} />
          {t("nav.share")}
        </Link>
        <Link
          href="/events"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <Calendar size={14} />
          {t("nav.events")}
        </Link>
      </div>
    </div>
  );
}
