"use client";

import { useState, useCallback, useId } from "react";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Pencil, ImagePlus, X } from "lucide-react";
import { CloseButton } from "@/components/ui/close-button";
import { TimeSelect } from "@/components/ui/time-select";
import { useI18n } from "@/hooks/use-i18n";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useImagePreview } from "@/hooks/use-image-preview";
import { EASE_MODAL } from "@/lib/animation";
import { FILE_UPLOAD, EVENTS } from "@/lib/constants/config";
import type { EventWithDetails } from "@/domain/event";

export interface EventFormData {
  title: string;
  eventDate: string;
  eventTime: string;
  location: string;
  description: string;
  imageFile: File | null;
}

interface EventComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  isSubmitting: boolean;
  editingEvent?: EventWithDetails | null;
}

export function EventComposeModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  editingEvent,
}: EventComposeModalProps) {
  const t = useI18n();
  const id = useId();

  const isEditMode = editingEvent !== null && editingEvent !== undefined;

  const [title, setTitle] = useState(editingEvent?.title ?? "");
  const [eventDate, setEventDate] = useState(editingEvent?.event_date ?? "");
  const [eventTime, setEventTime] = useState(editingEvent?.event_time ?? "");
  const [location, setLocation] = useState(editingEvent?.location ?? "");
  const [description, setDescription] = useState(editingEvent?.description ?? "");

  const {
    imageFile,
    imagePreview,
    fileInputRef,
    handleImageSelect,
    handleRemoveImage,
    clearPreview,
  } = useImagePreview();

  const handleClose = useCallback(() => {
    setTitle("");
    setEventDate("");
    setEventTime("");
    setLocation("");
    setDescription("");
    clearPreview();
    onClose();
  }, [onClose, clearPreview]);

  const handleSubmit = async () => {
    if (!title.trim() || !eventDate) return;
    await onSubmit({
      title: title.trim(),
      eventDate,
      eventTime,
      location,
      description,
      imageFile,
    });
  };

  useEscapeKey(isOpen && !isSubmitting, handleClose);
  useBodyScrollLock(isOpen);

  const canSubmit = title.trim().length > 0 && eventDate.length > 0 && !isSubmitting;

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
            className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:rounded-2xl bg-background sm:premium-surface flex flex-col sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <CloseButton onClick={handleClose} disabled={isSubmitting} />

              <h2 id={`${id}-title`} className="text-sm font-bold text-foreground">
                {isEditMode ? t("events.edit") : t("events.create")}
              </h2>

              <m.button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.02 } : undefined}
                whileTap={canSubmit ? { scale: 0.98 } : undefined}
                className={`h-9 px-5 rounded-full text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity ${
                  isEditMode ? "bg-amber-500 text-white" : "bg-foreground text-background"
                }`}
              >
                {isSubmitting
                  ? t("common.processing")
                  : isEditMode
                    ? t("events.update")
                    : t("events.create")}
              </m.button>
            </div>

            {/* Form area */}
            <div className="modal-content-responsive">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isEditMode ? "bg-amber-500/10" : "bg-brand-500/10"}`}
                >
                  {isEditMode ? (
                    <Pencil size={20} className="text-amber-500" />
                  ) : (
                    <Calendar size={20} className="text-brand-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isEditMode ? t("events.edit") : t("events.createEvent")}
                </p>
              </div>

              <div className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <label className="form-label">
                    {t("events.titleLabel")} <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("events.titlePlaceholder")}
                    maxLength={EVENTS.maxTitleLength}
                    autoFocus
                    className="input-modal"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="form-label">
                      {t("events.dateLabel")} <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      min={(() => {
                        const d = new Date();
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, "0");
                        const day = String(d.getDate()).padStart(2, "0");
                        return `${year}-${month}-${day}`;
                      })()}
                      className="input-modal"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="form-label">
                      {t("events.timeLabel")}
                    </label>
                    <TimeSelect value={eventTime} onChange={setEventTime} />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="form-label">
                    {t("events.locationLabel")}
                  </label>
                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40"
                    />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t("events.locationPlaceholder")}
                      className="input-modal pl-12"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="form-label">
                    {t("events.descriptionLabel")}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("events.descriptionPlaceholder")}
                    maxLength={EVENTS.maxDescriptionLength}
                    rows={3}
                    className="textarea-modal"
                  />
                </div>

                {/* Cover Image - Only for new events */}
                {!isEditMode && (
                  <div className="space-y-2">
                    <label className="form-label">
                      {t("events.coverImageLabel")}
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={FILE_UPLOAD.inputAccept}
                      onChange={handleImageSelect}
                      className="hidden"
                      aria-label={t("events.coverImageLabel")}
                    />

                    {imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden bg-muted">
                        <div className="relative aspect-[1.618/1]">
                          <Image
                            src={imagePreview}
                            alt={t("events.coverImagePreview")}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                          aria-label={t("common.remove")}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="upload-area group aspect-[2/1]"
                      >
                        <div className="upload-area-icon">
                          <ImagePlus size={24} className="text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {t("events.addCoverImage")}
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                          {t("events.coverImageHint")}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
