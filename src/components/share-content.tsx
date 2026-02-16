"use client";

import { useState, useCallback, useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { Gift, Plus, X, Clock, Trash2, Check, ImagePlus } from "lucide-react";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/hooks/use-i18n";
import { createShareItem, claimShareItem, deleteShareItem, updateShareItem, uploadShareItemImage } from "@/lib/share/actions";
import { prepareImageForUpload } from "@/lib/utils/image-compression";
import { SHARE_ITEMS, FILE_UPLOAD } from "@/lib/constants/config";
import { getInitials } from "@/lib/utils";
import { logError } from "@/lib/errors";
import type { ShareItemWithProfile } from "@/domain/share-item";

const EASE = [0.23, 1, 0.32, 1] as const;

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = editingItem !== null && editingItem !== undefined;

  const [title, setTitle] = useState(editingItem?.title ?? "");
  const [description, setDescription] = useState(editingItem?.description ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editingItem?.image_url ?? null);
  const [existingImageUrl] = useState<string | null>(editingItem?.image_url ?? null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (imagePreview && imagePreview !== existingImageUrl) {
      URL.revokeObjectURL(imagePreview);
    }
    onClose();
  }, [onClose, imagePreview, existingImageUrl]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePreview && imagePreview !== existingImageUrl) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImageUploadError(null);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  }, [imagePreview, existingImageUrl]);

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    if (imagePreview && imagePreview !== existingImageUrl) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [imagePreview, existingImageUrl]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setImageUploadError(null);
    const result = await onSubmit({ title: title.trim(), description: description.trim() || null, imageFile });
    if (!result.success) {
      setImageUploadError(result.error);
      return;
    }
    if (imagePreview && imagePreview !== existingImageUrl) {
      URL.revokeObjectURL(imagePreview);
    }
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

  const canSubmit = title.trim().length > 0 && !isSubmitting;

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-background sm:bg-black/50 sm:backdrop-blur-sm"
          onClick={isSubmitting ? undefined : handleClose}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:rounded-2xl bg-background sm:premium-surface flex flex-col sm:max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border/50 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                aria-label={t("common.close")}
              >
                <X size={20} className="text-foreground" />
              </button>

              <h2 id={`${id}-title`} className="text-sm font-bold text-foreground">
                {isEditMode ? t("share.editItem") : t("share.createItem")}
              </h2>

              {/* Spacer for layout balance */}
              <div className="w-10" />
            </div>

            {/* Form area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-muted-foreground tracking-wide ml-1">
                    {t("share.titleLabel")} <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("share.titlePlaceholder")}
                    maxLength={SHARE_ITEMS.maxTitleLength}
                    autoFocus
                    className="w-full h-13 px-5 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 focus:bg-background transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-muted-foreground tracking-wide ml-1">
                    {t("share.descriptionLabel")}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("share.descriptionPlaceholder")}
                    maxLength={SHARE_ITEMS.maxDescriptionLength}
                    rows={3}
                    className="w-full px-5 py-4 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 focus:bg-background transition-all duration-200 resize-none leading-relaxed"
                  />
                </div>

                {/* Image upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-muted-foreground tracking-wide ml-1">
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
                      className="w-full aspect-[16/10] rounded-xl border-2 border-dashed border-border/60 hover:border-foreground/30 bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 transition-all duration-200 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
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

                  {/* Image upload error */}
                  {imageUploadError && (
                    <p className="text-sm text-error mt-2">
                      {imageUploadError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
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

// Animation config
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function ShareContent({ items, currentUserId, isTeaser = false }: ShareContentProps) {
  const t = useI18n();
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
          setIsSubmitting(false);
          return { success: false, error: uploadResult.error };
        }
      } catch (error) {
        logError(error, { action: "handleSubmit:imageUpload" });
        setIsSubmitting(false);
        return { success: false, error: String(error) };
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
      {/* Compose Modal */}
      <ShareComposeModal
        isOpen={isComposeOpen}
        onClose={handleCloseCompose}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        editingItem={editingItem}
      />

      <m.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <m.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className={`text-sm font-medium px-5 py-4 rounded-xl border-l-4 ${
                feedback.type === "success"
                  ? "bg-success-bg/50 border-success text-success"
                  : "bg-error-bg/50 border-error text-error"
              }`}
            >
              {feedback.message}
            </m.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {items.length === 0 ? (
          <m.div
            variants={itemVariants}
            className="py-20 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 mb-8 rounded-2xl bg-muted/80 flex items-center justify-center">
              <Gift size={32} className="text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {t("share.empty")}
            </h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
              {t("share.emptyHint")}
            </p>
            {!isTeaser && (
              <m.button
                type="button"
                onClick={() => { setIsComposeOpen(true); setFeedback(null); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-12 px-7 rounded-full bg-foreground text-background text-sm font-semibold tracking-wide transition-all duration-200 shadow-lg inline-flex items-center gap-2.5"
              >
                <Plus size={18} strokeWidth={2.5} />
                {t("share.post")}
              </m.button>
            )}
          </m.div>
        ) : (
        /* Item grid - 2 columns on desktop */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {items.map((item, index) => {
            const displayName = item.profiles?.nickname ?? item.profiles?.name ?? t("common.formerResident");
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
                {/* Header */}
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

                  {/* Time remaining badge */}
                  {timeLeft && !isClaimed && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-lg">
                      <Clock size={12} />
                      {timeLeft}
                    </span>
                  )}
                </div>

                {/* Item image */}
                {item.image_url && (
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted mb-4 -mx-1">
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className={`object-cover transition-all duration-300 ${
                        isClaimed ? "grayscale opacity-60" : "group-hover:scale-[1.02]"
                      } ${isTeaser ? "blur-[6px]" : ""}`}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}

                {/* Content */}
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

                {/* Footer */}
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

      {/* FAB - Floating Action Button */}
      {!isTeaser && (
        <m.button
          type="button"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setIsComposeOpen(true); setFeedback(null); }}
          className="fixed bottom-24 sm:bottom-8 right-5 sm:right-8 z-40 w-14 h-14 rounded-full bg-foreground text-background shadow-lg shadow-foreground/20 flex items-center justify-center"
          aria-label={t("share.post")}
        >
          <Gift size={22} />
        </m.button>
      )}
    </>
  );
}
