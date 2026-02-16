"use client";

import { useState, useCallback, useMemo, useRef, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Calendar, Plus, X, CalendarDays, Users, Sparkles, Pencil, Trash2, ImagePlus } from "lucide-react";
import { Avatar, AvatarFallback, OptimizedAvatarImage } from "@/components/ui/avatar";
import { TimeSelect } from "@/components/ui/time-select";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { createEvent, updateEvent, toggleAttendance, deleteEvent, uploadEventCover } from "@/lib/events/actions";
import { prepareImageForUpload } from "@/lib/utils/image-compression";
import { FILE_UPLOAD, EVENTS } from "@/lib/constants/config";
import { getInitials } from "@/lib/utils";
import { logError } from "@/lib/errors";
import type { EventWithDetails } from "@/domain/event";

const MODAL_EASE = [0.23, 1, 0.32, 1] as const;

interface EventFormData {
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

function EventComposeModal({ isOpen, onClose, onSubmit, isSubmitting, editingEvent }: EventComposeModalProps) {
  const t = useI18n();
  const id = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = editingEvent !== null && editingEvent !== undefined;

  const [title, setTitle] = useState(editingEvent?.title ?? "");
  const [eventDate, setEventDate] = useState(editingEvent?.event_date ?? "");
  const [eventTime, setEventTime] = useState(editingEvent?.event_time ?? "");
  const [location, setLocation] = useState(editingEvent?.location ?? "");
  const [description, setDescription] = useState(editingEvent?.description ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setTitle("");
    setEventDate("");
    setEventTime("");
    setLocation("");
    setDescription("");
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    onClose();
  }, [onClose, imagePreview]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  }, [imagePreview]);

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [imagePreview]);

  const handleSubmit = async () => {
    if (!title.trim() || !eventDate) return;
    await onSubmit({ title: title.trim(), eventDate, eventTime, location, description, imageFile });
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

  const canSubmit = title.trim().length > 0 && eventDate.length > 0 && !isSubmitting;

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
            transition={{ duration: 0.3, ease: MODAL_EASE }}
            className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:rounded-2xl bg-background sm:premium-surface flex flex-col sm:max-h-[85vh]"
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
                {isEditMode ? t("events.edit") : t("events.create")}
              </h2>

              <m.button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.02 } : undefined}
                whileTap={canSubmit ? { scale: 0.98 } : undefined}
                className={`h-9 px-5 rounded-full text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity ${
                  isEditMode
                    ? "bg-amber-500 text-white"
                    : "bg-foreground text-background"
                }`}
              >
                {isSubmitting
                  ? t("common.processing")
                  : isEditMode ? t("events.update") : t("events.create")
                }
              </m.button>
            </div>

            {/* Form area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isEditMode ? "bg-amber-500/10" : "bg-brand-500/10"}`}>
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
                  <label className="block text-xs font-semibold text-muted-foreground tracking-wide ml-1">
                    {t("events.titleLabel")} <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("events.titlePlaceholder")}
                    maxLength={EVENTS.maxTitleLength}
                    autoFocus
                    className="w-full h-13 px-5 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 focus:bg-background transition-all duration-200"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-muted-foreground tracking-wide ml-1">
                      {t("events.dateLabel")} <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      min={(() => {
                        const d = new Date();
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })()}
                      className="w-full h-13 px-5 bg-muted/50 border border-border/50 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 focus:bg-background transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-muted-foreground tracking-wide ml-1">
                      {t("events.timeLabel")}
                    </label>
                    <TimeSelect
                      value={eventTime}
                      onChange={setEventTime}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-muted-foreground tracking-wide ml-1">
                    {t("events.locationLabel")}
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t("events.locationPlaceholder")}
                      className="w-full h-13 pl-12 pr-5 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 focus:bg-background transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-muted-foreground tracking-wide ml-1">
                    {t("events.descriptionLabel")}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("events.descriptionPlaceholder")}
                    maxLength={EVENTS.maxDescriptionLength}
                    rows={3}
                    className="w-full px-5 py-4 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 focus:bg-background transition-all duration-200 resize-none leading-relaxed"
                  />
                </div>

                {/* Cover Image - Only for new events (editing uses event detail page) */}
                {!isEditMode && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-muted-foreground tracking-wide ml-1">
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
                        className="w-full aspect-[2/1] rounded-xl border-2 border-dashed border-border/60 hover:border-foreground/30 bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 transition-all duration-200 group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
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

interface AttendeesModalProps {
  event: EventWithDetails | null;
  onClose: () => void;
  isTeaser: boolean;
}

function AttendeesModal({ event, onClose, isTeaser }: AttendeesModalProps) {
  const t = useI18n();
  const id = useId();
  const isOpen = event !== null;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
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

  const attendees = event?.event_attendees ?? [];

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: MODAL_EASE }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm rounded-2xl bg-background premium-surface flex flex-col max-h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border/50 shrink-0">
              <h2 id={`${id}-title`} className="text-sm font-bold text-foreground">
                {t("events.attendeesTitle")}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                aria-label={t("common.close")}
              >
                <X size={20} className="text-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {attendees.length === 0 ? (
                <div className="py-8 text-center">
                  <Users size={32} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {t("events.noAttendees")}
                  </p>
                </div>
              ) : (
                <m.ul
                  className="space-y-2"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.04 },
                    },
                  }}
                >
                  {attendees.map((attendee) => {
                    const profile = attendee.profiles;
                    const displayName = profile?.nickname ?? profile?.name ?? t("common.unregistered");
                    const avatarUrl = profile?.avatar_url ?? null;

                    return (
                      <m.li
                        key={attendee.user_id}
                        variants={{
                          hidden: { opacity: 0, x: -8 },
                          visible: { opacity: 1, x: 0 },
                        }}
                      >
                        {isTeaser ? (
                          <div className="flex items-center gap-3 p-2 rounded-xl">
                            <Avatar className="w-10 h-10 ring-2 ring-border/30">
                              <OptimizedAvatarImage
                                src={avatarUrl}
                                alt={displayName}
                                context="card"
                                isBlurred={isTeaser}
                                fallback={
                                  <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                                    {getInitials(displayName)}
                                  </AvatarFallback>
                                }
                              />
                            </Avatar>
                            <span className="text-sm font-medium text-foreground">
                              {displayName}
                            </span>
                          </div>
                        ) : (
                          <Link
                            href={`/residents/${attendee.user_id}`}
                            onClick={onClose}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/60 transition-colors group"
                          >
                            <Avatar className="w-10 h-10 ring-2 ring-border/30 group-hover:ring-brand-500/30 transition-all">
                              <OptimizedAvatarImage
                                src={avatarUrl}
                                alt={displayName}
                                context="card"
                                fallback={
                                  <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                                    {getInitials(displayName)}
                                  </AvatarFallback>
                                }
                              />
                            </Avatar>
                            <span className="text-sm font-medium text-foreground group-hover:text-brand-600 transition-colors">
                              {displayName}
                            </span>
                          </Link>
                        )}
                      </m.li>
                    );
                  })}
                </m.ul>
              )}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

interface EventsContentProps {
  events: EventWithDetails[];
  currentUserId: string;
  isTeaser?: boolean;
  initialEditEventId?: string;
}

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekday(dateStr: string, isJapanese: boolean): string {
  const date = new Date(dateStr + "T00:00:00");
  const weekdays = isJapanese ? WEEKDAYS_JA : WEEKDAYS_EN;
  return weekdays[date.getDay()];
}

function formatEventDate(dateStr: string, t: ReturnType<typeof useI18n>): { label: string; isSpecial: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: t("events.today"), isSpecial: true };
  if (diffDays === 1) return { label: t("events.tomorrow"), isSpecial: true };

  const month = eventDate.getMonth() + 1;
  const day = eventDate.getDate();
  return { label: `${month}/${day}`, isSpecial: false };
}

function parseTimeToMinutes(time: string | null): number {
  if (!time) return Infinity;
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return Infinity;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function groupEventsByDate(events: EventWithDetails[]): Map<string, EventWithDetails[]> {
  const grouped = new Map<string, EventWithDetails[]>();
  for (const event of events) {
    const existing = grouped.get(event.event_date) || [];
    existing.push(event);
    grouped.set(event.event_date, existing);
  }

  for (const [date, dateEvents] of grouped) {
    dateEvents.sort((a, b) => parseTimeToMinutes(a.event_time) - parseTimeToMinutes(b.event_time));
    grouped.set(date, dateEvents);
  }

  return grouped;
}

function generateCalendarDates(): { date: string; day: number; weekday: number; isToday: boolean }[] {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    dates.push({
      date: dateStr,
      day: date.getDate(),
      weekday: date.getDay(),
      isToday: i === 0,
    });
  }
  return dates;
}

// Animation variants with natural easing
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export function EventsContent({ events, currentUserId, isTeaser = false, initialEditEventId }: EventsContentProps) {
  const t = useI18n();
  const router = useRouter();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [showAttendeesEvent, setShowAttendeesEvent] = useState<EventWithDetails | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const locale = useLocale();
  const isJapanese = locale === "ja";
  const grouped = useMemo(() => groupEventsByDate(events), [events]);
  const calendarDates = useMemo(() => generateCalendarDates(), []);

  const eventDates = useMemo(() => new Set(events.map((e) => e.event_date)), [events]);

  useEffect(() => {
    if (calendarRef.current && selectedCalendarDate) {
      const element = document.getElementById(`date-${selectedCalendarDate}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [selectedCalendarDate]);

  const handleCloseCompose = useCallback(() => {
    setIsComposeOpen(false);
    setEditingEvent(null);
  }, []);

  const handleEdit = useCallback((event: EventWithDetails) => {
    setEditingEvent(event);
    setIsComposeOpen(true);
    setFeedback(null);
  }, []);

  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current || !initialEditEventId) return;
    hasInitializedRef.current = true;

    const eventToEdit = events.find((e) => e.id === initialEditEventId);
    if (eventToEdit) {
      setTimeout(() => handleEdit(eventToEdit), 0);
    }
  }, [initialEditEventId, events, handleEdit]);

  const handleSubmit = useCallback(async (data: EventFormData) => {
    if (!data.title.trim() || !data.eventDate || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      title: data.title,
      description: data.description || null,
      event_date: data.eventDate,
      event_time: data.eventTime || null,
      location: data.location || null,
    };

    if (editingEvent) {
      const result = await updateEvent(editingEvent.id, payload);
      setIsSubmitting(false);
      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
        return;
      }
    } else {
      const result = await createEvent(payload);
      if ("error" in result) {
        setIsSubmitting(false);
        setFeedback({ type: "error", message: result.error });
        return;
      }

      // Upload cover image if provided
      if (data.imageFile && result.eventId) {
        try {
          const prepared = await prepareImageForUpload(data.imageFile);
          const formData = new FormData();
          formData.append("cover", prepared.file);

          const uploadResult = await uploadEventCover(result.eventId, formData);
          if ("error" in uploadResult) {
            // Event created but image upload failed - show warning but don't fail
            setFeedback({ type: "error", message: uploadResult.error });
            setIsSubmitting(false);
            handleCloseCompose();
            router.refresh();
            return;
          }
        } catch (error) {
          logError(error, { action: "handleSubmit:uploadEventCover" });
          // Continue even if image upload fails
        }
      }

      setIsSubmitting(false);
    }

    handleCloseCompose();
    router.refresh();
  }, [isSubmitting, editingEvent, handleCloseCompose, router]);

  const handleToggleAttendance = useCallback(async (eventId: string) => {
    const result = await toggleAttendance(eventId);
    if ("error" in result) {
      setFeedback({ type: "error", message: result.error });
    } else {
      router.refresh();
    }
  }, [router]);

  const handleDelete = useCallback(async (eventId: string) => {
    if (!confirm(t("events.deleteConfirm"))) return;
    const result = await deleteEvent(eventId);
    if ("error" in result) {
      setFeedback({ type: "error", message: result.error });
    } else {
      router.refresh();
    }
  }, [t, router]);

  const handleCalendarDateClick = (date: string) => {
    setSelectedCalendarDate(date);
    const section = document.getElementById(`events-${date}`);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const filteredEvents = selectedCalendarDate
    ? events.filter((e) => e.event_date === selectedCalendarDate)
    : events;

  const filteredGrouped = useMemo(() => {
    if (!selectedCalendarDate) return grouped;
    const filtered = new Map<string, EventWithDetails[]>();
    const dateEvents = grouped.get(selectedCalendarDate);
    if (dateEvents) {
      filtered.set(selectedCalendarDate, dateEvents);
    }
    return filtered;
  }, [grouped, selectedCalendarDate]);

  return (
    <>
      {/* Compose Modal - key forces re-mount when editingEvent changes */}
      <EventComposeModal
        key={editingEvent?.id ?? "new"}
        isOpen={isComposeOpen}
        onClose={handleCloseCompose}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        editingEvent={editingEvent}
      />

      {/* Main container: Golden ratio vertical rhythm (space-y-8 ≈ 32px) */}
      <m.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
      {/* ═══════════════════════════════════════════════════════════════════
          CALENDAR STRIP (Compact Golden Ratio Design)
          - Touch targets: 44px minimum (Fitts' Law)
          - Visual hierarchy: Today > Selected > HasEvents > Default
          - Fibonacci spacing: 8 → 13 → 21
      ═══════════════════════════════════════════════════════════════════ */}
      <m.section
        variants={itemVariants}
        className="premium-surface rounded-2xl overflow-hidden"
      >
        {/* Compact header - inline style */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-brand-500" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
              {t("events.nextTwoWeeks")}
            </span>
          </div>
          {selectedCalendarDate && (
            <button
              type="button"
              onClick={() => setSelectedCalendarDate(null)}
              className="text-[11px] font-bold text-brand-500 hover:text-brand-600 transition-colors"
            >
              {t("events.showAll")}
            </button>
          )}
        </div>

        {/* Calendar scroll - tighter spacing */}
        <div
          ref={calendarRef}
          className="flex gap-1 overflow-x-auto px-3 py-3 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {calendarDates.map((d, i) => {
            const hasEvents = eventDates.has(d.date);
            const isSelected = selectedCalendarDate === d.date;
            const isWeekend = d.weekday === 0 || d.weekday === 6;
            const weekdays = isJapanese ? WEEKDAYS_JA : WEEKDAYS_EN;

            return (
              <m.button
                key={d.date}
                id={`date-${d.date}`}
                type="button"
                onClick={() => handleCalendarDateClick(d.date)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: i * 0.015 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative flex-shrink-0 w-11 h-[52px] rounded-xl
                  flex flex-col items-center justify-center
                  transition-all duration-150
                  ${isSelected
                    ? "bg-foreground text-background shadow-md"
                    : d.isToday
                      ? "bg-brand-500/15 ring-1 ring-brand-500/40 text-foreground"
                      : hasEvents
                        ? "bg-muted/70 text-foreground"
                        : "bg-muted/40 hover:bg-muted/60 text-foreground"
                  }
                `}
              >
                {/* Weekday - compact */}
                <span
                  className={`text-[9px] font-bold tracking-wide leading-none ${
                    isSelected
                      ? "text-background/60"
                      : isWeekend
                        ? "text-rose-400/70"
                        : "text-muted-foreground/70"
                  }`}
                >
                  {weekdays[d.weekday]}
                </span>

                {/* Day number */}
                <span className={`text-base font-bold leading-tight mt-0.5 ${isSelected ? "text-background" : ""}`}>
                  {d.day}
                </span>

                {/* Event indicator - integrated dot */}
                {hasEvents && !isSelected && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-brand-500" />
                )}
              </m.button>
            );
          })}
        </div>
      </m.section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEEDBACK MESSAGE
      ═══════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════
          EMPTY STATE
          - Centered, clear call-to-action
          - Golden ratio proportions
      ═══════════════════════════════════════════════════════════════════ */}
      {filteredEvents.length === 0 ? (
        <m.div
          variants={itemVariants}
          className="py-20 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 mb-8 rounded-2xl bg-muted/80 flex items-center justify-center">
            <Sparkles size={32} className="text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {selectedCalendarDate
              ? t("events.noEventsOnDay")
              : t("events.empty")
            }
          </h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
            {t("events.createAndInvite")}
          </p>
          {!isTeaser && (
            <m.button
              type="button"
              onClick={() => { setEditingEvent(null); setIsComposeOpen(true); setFeedback(null); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-12 px-7 rounded-full bg-foreground text-background text-sm font-semibold tracking-wide transition-all duration-200 shadow-lg inline-flex items-center gap-2.5"
            >
              <Plus size={18} strokeWidth={2.5} />
              {t("events.create")}
            </m.button>
          )}
        </m.div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
            EVENT LIST
            - Date groups with clear separation
            - Golden ratio spacing between groups (space-y-10 ≈ 40px)
        ═══════════════════════════════════════════════════════════════════ */
        <div className="space-y-10">
          {Array.from(filteredGrouped.entries()).map(([date, dateEvents], groupIndex) => {
            const { label: dateLabel, isSpecial } = formatEventDate(date, t);
            const weekday = getWeekday(date, isJapanese);

            return (
              <m.section
                key={date}
                id={`events-${date}`}
                variants={itemVariants}
                className="space-y-5"
              >
                {/* Date header - Visual anchor */}
                <div className="flex items-center gap-4">
                  <div className={`
                    flex items-center gap-2.5 px-4 py-2.5 rounded-xl
                    ${isSpecial
                      ? "bg-foreground text-background"
                      : "bg-muted"
                    }
                  `}>
                    <span className={`text-base font-bold ${isSpecial ? "text-background" : "text-foreground"}`}>
                      {dateLabel}
                    </span>
                    <span className={`text-xs font-medium ${isSpecial ? "text-background/60" : "text-muted-foreground"}`}>
                      {weekday}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {t("events.countLabel", { count: dateEvents.length })}
                  </span>
                </div>

                {/* Event cards grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {dateEvents.map((event, eventIndex) => {
                    const creatorName = event.profiles?.nickname ?? event.profiles?.name ?? t("common.formerResident");
                    const isMine = event.user_id === currentUserId;
                    const isAttending = event.event_attendees.some(
                      (a) => a.user_id === currentUserId
                    );
                    const attendeeCount = event.event_attendees.length;

                    return (
                      <m.article
                        key={event.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.4,
                          ease: [0.25, 0.46, 0.45, 0.94],
                          delay: (groupIndex * 0.08) + (eventIndex * 0.05),
                        }}
                        whileHover={{ y: -3, transition: { duration: 0.2 } }}
                        className="premium-surface rounded-2xl overflow-hidden group"
                      >
                        {/* Cover image - Golden ratio aspect (≈ 1.618) */}
                        {event.cover_image_url && (
                          isTeaser ? (
                            <div className="relative aspect-[1.618/1] bg-muted">
                              <Image
                                src={event.cover_image_url}
                                alt={event.title}
                                fill
                                sizes="(min-width: 1024px) 448px, 100vw"
                                className="object-cover blur-[3px]"
                              />
                            </div>
                          ) : (
                            <Link href={`/events/${event.id}`}>
                              <div className="relative aspect-[1.618/1] bg-muted overflow-hidden">
                                <Image
                                  src={event.cover_image_url}
                                  alt={event.title}
                                  fill
                                  sizes="(min-width: 1024px) 448px, 100vw"
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                            </Link>
                          )
                        )}

                        {/* Card content - F-pattern layout */}
                        <div className="p-5 sm:p-6 space-y-4">
                          {/* Title row - Primary focus */}
                          <div className="flex items-start justify-between gap-4">
                            {isTeaser ? (
                              <span className="text-lg font-bold text-foreground leading-snug blur-[2.5px] select-none">
                                {event.title}
                              </span>
                            ) : (
                              <Link
                                href={`/events/${event.id}`}
                                className="text-lg font-bold text-foreground leading-snug hover:text-brand-600 transition-colors"
                              >
                                {event.title}
                              </Link>
                            )}
                            {isMine && (
                              <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(event)}
                                  className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                                  aria-label={t("common.edit")}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(event.id)}
                                  className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                  aria-label={t("common.delete")}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Meta info - Secondary focus */}
                          <div className="flex flex-wrap gap-2">
                            {event.event_time && (
                              <span className={`inline-flex items-center gap-2 px-3 py-1.5 bg-muted/60 rounded-lg text-sm font-medium text-foreground/80 ${isTeaser ? "blur-[2px] select-none" : ""}`}>
                                <Clock size={14} className="text-muted-foreground" />
                                {event.event_time}
                              </span>
                            )}
                            {event.location && (
                              <span className={`inline-flex items-center gap-2 px-3 py-1.5 bg-muted/60 rounded-lg text-sm font-medium text-foreground/80 ${isTeaser ? "blur-[2px] select-none" : ""}`}>
                                <MapPin size={14} className="text-muted-foreground" />
                                {event.location}
                              </span>
                            )}
                          </div>

                          {/* Description - Tertiary focus */}
                          {event.description && (
                            <p className={`text-sm text-muted-foreground leading-relaxed line-clamp-2 ${isTeaser ? "blur-[3px] select-none" : ""}`}>
                              {event.description}
                            </p>
                          )}

                          {/* Footer - Actions and meta */}
                          <div className="flex items-center justify-between pt-4 border-t border-border/40">
                            {/* Creator info */}
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 border border-border/50">
                                <OptimizedAvatarImage
                                  src={event.profiles?.avatar_url}
                                  alt={creatorName}
                                  context="card"
                                  isBlurred={isTeaser}
                                  fallback={
                                    <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                                      {getInitials(creatorName)}
                                    </AvatarFallback>
                                  }
                                />
                              </Avatar>
                              <span className="text-sm font-medium text-muted-foreground">
                                {creatorName}
                              </span>
                            </div>

                            {/* Attendance controls */}
                            <div className="flex items-center gap-3">
                              {attendeeCount > 0 && (
                                <m.button
                                  type="button"
                                  onClick={() => setShowAttendeesEvent(event)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 bg-muted/60 hover:bg-muted/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                  aria-label={t("events.viewAttendees")}
                                >
                                  <Users size={14} />
                                  {attendeeCount}
                                </m.button>
                              )}
                              <m.button
                                type="button"
                                onClick={() => !isTeaser && handleToggleAttendance(event.id)}
                                disabled={isTeaser}
                                whileHover={!isTeaser ? { scale: 1.03 } : {}}
                                whileTap={!isTeaser ? { scale: 0.97 } : {}}
                                className={`
                                  h-10 px-5 rounded-lg text-sm font-semibold transition-all duration-200
                                  ${isAttending
                                    ? "bg-brand-500/10 text-brand-600 ring-1 ring-brand-500/30"
                                    : "bg-foreground text-background hover:bg-foreground/90"
                                  }
                                  ${isTeaser ? "opacity-50 cursor-not-allowed" : ""}
                                `}
                              >
                                {isAttending ? t("events.attending") : t("events.attend")}
                              </m.button>
                            </div>
                          </div>
                        </div>
                      </m.article>
                    );
                  })}
                </div>
              </m.section>
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
          onClick={() => { setEditingEvent(null); setIsComposeOpen(true); setFeedback(null); }}
          className="fixed bottom-24 sm:bottom-8 right-5 sm:right-8 z-40 w-14 h-14 rounded-full bg-foreground text-background shadow-lg shadow-foreground/20 flex items-center justify-center"
          aria-label={t("events.create")}
        >
          <CalendarDays size={22} />
        </m.button>
      )}

      {/* Attendees Modal */}
      <AttendeesModal
        event={showAttendeesEvent}
        onClose={() => setShowAttendeesEvent(null)}
        isTeaser={isTeaser}
      />
    </>
  );
}
