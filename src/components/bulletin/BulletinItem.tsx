"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { Trash2, Pencil, Check } from "lucide-react";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/hooks/use-i18n";
import { BULLETIN } from "@/lib/constants/config";
import { getInitials } from "@/lib/utils";
import { formatTimestamp, SPRING, EASE_OUT } from "./utils";
import type { BulletinWithProfile } from "@/domain/bulletin";

export interface BulletinItemProps {
  bulletin: BulletinWithProfile;
  currentUserId: string;
  isTeaser: boolean;
  isNew: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string, message: string) => Promise<boolean>;
  isDeleting: boolean;
  locale: string;
}

export function BulletinItem({
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

  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState(bulletin.message);
  const [isSaving, setIsSaving] = useState(false);

  const isEdited = bulletin.updated_at && bulletin.updated_at !== bulletin.created_at;

  const handleStartEdit = useCallback(() => {
    setEditMessage(bulletin.message);
    setIsEditing(true);
  }, [bulletin.message]);

  const handleCancelEdit = useCallback(() => {
    setEditMessage(bulletin.message);
    setIsEditing(false);
  }, [bulletin.message]);

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

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing]);

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

        <div className="flex-1 min-w-0">
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

            {isMine && !bulletin.id.startsWith("temp-") && !isEditing && (
              <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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

                <div className="flex items-center justify-between">
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
