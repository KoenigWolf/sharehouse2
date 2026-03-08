"use client";

import { useState, useCallback, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { Gift, X, Clock, Trash2, Check, ImagePlus } from "lucide-react";
import { CloseButton } from "@/components/ui/close-button";
import { EmptyState } from "@/components/ui/empty-state";
import { AnimatedFeedbackMessage } from "@/components/ui/feedback-message";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useImagePreview } from "@/hooks/use-image-preview";
import { createShareItem, claimShareItem, deleteShareItem, updateShareItem, uploadShareItemImage } from "@/lib/share/actions";
import { prepareImageForUpload } from "@/lib/utils/image-compression";
import { SHARE_ITEMS, FILE_UPLOAD, IMAGE } from "@/lib/constants/config";
import { getInitials, getDisplayName } from "@/lib/utils";
import { logError } from "@/lib/errors";
import { EASE_MODAL, staggerContainer } from "@/lib/animation";
import { getImageAlt } from "@/lib/utils/accessibility";
import type { ShareItemWithProfile } from "@/domain/share-item";

interface ShareFormData {
  title: string;
  description: string | null;
  imageFile: File | null;
}

type SubmitResult = { success: true } | { success: false; error: string };

interface ShareComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShareFormData) => Promise<SubmitResult>;
  isSubmitting: boolean;
  editingItem?: ShareItemWithProfile | null;
}

function ShareComposeModalInner({ isOpen, onClose, onSubmit, isSubmitting, editingItem }: ShareComposeModalProps) {
  const t = useI18n();
  const id = useId();
  const isEditMode = editingItem !== null && editingItem !== undefined;

  const [title, setTitle] = useState(editingItem?.title ?? "");
  const [description, setDescription] = useState(editingItem?.description ?? "");
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const {
    imageFile,
    imagePreview,
    fileInputRef,
    handleImageSelect: baseHandleImageSelect,
    handleRemoveImage,
    clearPreview,
  } = useImagePreview({ initialUrl: editingItem?.image_url ?? null });

  const handleClose = useCallback(() => {
    clearPreview();
    onClose();
  }, [onClose, clearPreview]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUploadError(null);
    baseHandleImageSelect(e);
  }, [baseHandleImageSelect]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setImageUploadError(null);
    const result = await onSubmit({ title: title.trim(), description: description.trim() || null, imageFile });
    if (!result.success) {
      setImageUploadError(result.error);
      return;
    }
    clearPreview();
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

  useBodyScrollLock(isOpen);

  const canSubmit = title.trim().length > 0 && !isSubmitting;

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="modal-overlay"
          onClick={isSubmitting ? undefined : handleClose}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.3, ease: EASE_MODAL }}
            className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:rounded-2xl bg-background sm:premium-surface flex flex-col sm:max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <CloseButton onClick={handleClose} disabled={isSubmitting} />

              <h2 id={`${id}-title`} className="text-sm font-bold text-foreground">
                {isEditMode ? t("share.editItem") : t("share.createItem")}
              </h2>

              <div className="w-10" />
            </div>

            <div className="modal-content-responsive">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="form-label">
                    {t("share.titleLabel")} <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("share.titlePlaceholder")}
                    maxLength={SHARE_ITEMS.maxTitleLength}
                    autoFocus
                    className="input-modal"
                  />
                </div>

                <div className="space-y-2">
                  <label className="form-label">
                    {t("share.descriptionLabel")}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("share.descriptionPlaceholder")}
                    maxLength={SHARE_ITEMS.maxDescriptionLength}
                    rows={3}
                    className="textarea-modal"
                  />
                </div>

                <div className="space-y-2">
                  <label className="form-label">
                    {t("share.imageLabel")}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={FILE_UPLOAD.inputAccept}
                    onChange={handleImageSelect}
                    className="sr-only"
                    aria-label={t("share.addImage")}
                  />
                  {imagePreview ? (
                    <div className="relative">
                      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted">
                        <Image
                          src={imagePreview}
                          alt={t("share.imagePreview")}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <m.button
                        type="button"
                        onClick={handleRemoveImage}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                        aria-label={t("common.remove")}
                      >
                        <X size={16} />
                      </m.button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="upload-area group aspect-[16/10]"
                    >
                      <div className="upload-area-icon">
                        <ImagePlus size={24} className="text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {t("share.addImage")}
                      </span>
                      <span className="text-xs text-muted-foreground/60">
                        {t("share.imageHint")}
                      </span>
                    </button>
                  )}

                  {imageUploadError && (
                    <p className="text-sm text-error mt-2">
                      {imageUploadError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 py-4 border-t border-border/50 shrink-0 flex justify-end">
              <m.button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.02 } : undefined}
                whileTap={canSubmit ? { scale: 0.98 } : undefined}
                className={`h-11 px-6 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity ${
                  isEditMode
                    ? "bg-amber-500 text-white"
                    : "bg-foreground text-background"
                }`}
              >
                {isSubmitting
                  ? t("common.processing")
                  : isEditMode ? t("share.update") : t("share.post")
                }
              </m.button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

function ShareComposeModal(props: ShareComposeModalProps) {
  // Use key to remount component when editingItem changes, resetting all state
  const key = props.editingItem?.id ?? "new";
  return <ShareComposeModalInner key={key} {...props} />;
}

interface ShareContentProps {
  items: ShareItemWithProfile[];
  currentUserId?: string;
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
  const locale = useLocale();
  const router = useRouter();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShareItemWithProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleCloseCompose = useCallback(() => {
    setIsComposeOpen(false);
    setEditingItem(null);
  }, []);

  const handleEdit = useCallback((item: ShareItemWithProfile) => {
    setEditingItem(item);
    setIsComposeOpen(true);
    setFeedback(null);
  }, []);

  const handleSubmit = useCallback(async (data: ShareFormData): Promise<SubmitResult> => {
    if (!data.title.trim() || isSubmitting) return { success: false, error: "" };
    setIsSubmitting(true);
    setFeedback(null);

    let itemId: string;

    if (editingItem) {
      // Update existing item
      const result = await updateShareItem(editingItem.id, data.title, data.description);
      if ("error" in result) {
        setIsSubmitting(false);
        setFeedback({ type: "error", message: result.error });
        return { success: false, error: result.error };
      }
      itemId = editingItem.id;
    } else {
      // Create new item
      const result = await createShareItem(data.title, data.description);
      if ("error" in result) {
        setIsSubmitting(false);
        setFeedback({ type: "error", message: result.error });
        return { success: false, error: result.error };
      }
      itemId = result.itemId;
    }

    // Upload image if provided
    if (data.imageFile) {
      try {
        const prepared = await prepareImageForUpload(data.imageFile);
        const formData = new FormData();
        formData.append("image", prepared.file);
        const uploadResult = await uploadShareItemImage(itemId, formData);
        if ("error" in uploadResult) {
          logError(new Error(uploadResult.error), { action: "handleSubmit:imageUpload" });
          setFeedback({ type: "error", message: uploadResult.error });
          setIsSubmitting(false);
          return { success: false, error: uploadResult.error };
        }
      } catch (error) {
        logError(error, { action: "handleSubmit:imageUpload" });
        const errorMessage = error instanceof Error ? error.message : String(error);
        setFeedback({ type: "error", message: errorMessage });
        setIsSubmitting(false);
        return { success: false, error: errorMessage };
      }
    }

    setIsSubmitting(false);
    handleCloseCompose();
    router.refresh();
    return { success: true };
  }, [isSubmitting, editingItem, handleCloseCompose, router]);

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
    <>
      <ShareComposeModal
        isOpen={isComposeOpen}
        onClose={handleCloseCompose}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        editingItem={editingItem}
      />

      <m.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <AnimatedFeedbackMessage
          show={feedback !== null}
          type={feedback?.type ?? "error"}
          message={feedback?.message ?? ""}
        />

        {items.length === 0 ? (
          <EmptyState
            icon={Gift}
            title={t("share.empty")}
            description={t("share.emptyHint")}
            action={
              isTeaser
                ? undefined
                : {
                    label: t("share.post"),
                    onClick: () => {
                      setIsComposeOpen(true);
                      setFeedback(null);
                    },
                  }
            }
          />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {items.map((item, index) => {
            const displayName = getDisplayName(item.profiles, t("common.formerResident"));
            const isMine = item.user_id === currentUserId;
            const isClaimed = item.status === "claimed";
            const timeLeft = formatTimeRemaining(item.expires_at);

            const isEditable = isMine && !isClaimed && !isTeaser;

            return (
              <m.article
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.05,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={!isClaimed ? { y: -3, transition: { duration: 0.2 } } : {}}
                onClick={isEditable ? () => handleEdit(item) : undefined}
                className={`premium-surface rounded-2xl p-5 sm:p-6 flex flex-col group ${
                  isClaimed ? "opacity-60" : ""
                } ${isEditable ? "cursor-pointer" : ""}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 rounded-lg border border-border/50">
                      <OptimizedAvatarImage
                        src={item.profiles?.avatar_url}
                        alt={displayName}
                        context="card"
                        isBlurred={isTeaser}
                        fallback={
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {getInitials(displayName)}
                          </span>
                        }
                        fallbackClassName="bg-muted"
                      />
                    </Avatar>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate block">
                        {displayName}
                      </span>
                      {item.profiles?.room_number && (
                        <span className="text-xs text-muted-foreground">
                          {item.profiles.room_number}
                        </span>
                      )}
                    </div>
                  </div>

                  {timeLeft && !isClaimed && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-lg">
                      <Clock size={12} />
                      {timeLeft}
                    </span>
                  )}
                </div>

                {item.image_url && (
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted mb-4 -mx-1">
                    <Image
                      src={item.image_url}
                      alt={getImageAlt.shareItemImage(item.title, locale)}
                      fill
                      priority={index === 0}
                      placeholder="blur"
                      blurDataURL={IMAGE.blurDataURL}
                      className={`object-cover transition-all duration-300 ${
                        isClaimed ? "grayscale opacity-60" : "group-hover:scale-[1.02]"
                      } ${isTeaser ? "blur-[6px]" : ""}`}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}

                <div className="flex-1 space-y-2 mb-5">
                  <h4 className={`text-base font-bold ${
                    isTeaser ? "blur-[2.5px] select-none" : isClaimed ? "text-muted-foreground line-through" : "text-foreground"
                  }`}>
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className={`text-sm leading-relaxed ${
                      isTeaser ? "blur-[3px] select-none" : isClaimed ? "text-muted-foreground/60" : "text-muted-foreground"
                    }`}>
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                  {isClaimed ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                      <Check size={14} />
                      {t("share.claimed")}
                    </span>
                  ) : !isMine ? (
                    <m.button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isTeaser) handleClaim(item.id);
                      }}
                      disabled={isSubmitting || isTeaser}
                      whileHover={!isTeaser ? { scale: 1.03 } : {}}
                      whileTap={!isTeaser ? { scale: 0.97 } : {}}
                      className={`h-10 px-6 rounded-xl bg-foreground text-background text-sm font-semibold transition-all duration-200 ${
                        isTeaser ? "opacity-50 cursor-not-allowed" : "hover:bg-foreground/90"
                      }`}
                    >
                      {t("share.claim")}
                    </m.button>
                  ) : (
                    <div />
                  )}

                  {isMine && !isClaimed && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      disabled={isSubmitting}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-error hover:bg-error/10 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                      aria-label={t("common.delete")}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </m.article>
            );
          })}
        </div>
      )}
      </m.div>

      {!isTeaser && (
        <FloatingActionButton
          onClick={() => { setIsComposeOpen(true); setFeedback(null); }}
          icon={Gift}
          label={t("share.post")}
        />
      )}
    </>
  );
}
