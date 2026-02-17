"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Plus, CalendarDays, Users, Sparkles, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { createEvent, updateEvent, toggleAttendance, deleteEvent, uploadEventCover } from "@/lib/events/actions";
import { prepareImageForUpload } from "@/lib/utils/image-compression";
import { IMAGE } from "@/lib/constants/config";
import { getInitials } from "@/lib/utils";
import { logError } from "@/lib/errors";
import { getImageAlt } from "@/lib/utils/accessibility";
import type { EventWithDetails } from "@/domain/event";
import {
  EventComposeModal,
  AttendeesModal,
  getWeekday,
  formatEventDate,
  groupEventsByDate,
  generateCalendarDates,
  containerVariants,
  itemVariants,
  WEEKDAYS_JA,
  WEEKDAYS_EN,
  type EventFormData,
} from "@/components/events";

interface EventsContentProps {
  events: EventWithDetails[];
  currentUserId: string;
  isTeaser?: boolean;
  initialEditEventId?: string;
}

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

      if (data.imageFile && result.eventId) {
        try {
          const prepared = await prepareImageForUpload(data.imageFile);
          const formData = new FormData();
          formData.append("cover", prepared.file);

          const uploadResult = await uploadEventCover(result.eventId, formData);
          if ("error" in uploadResult) {
            setFeedback({ type: "error", message: uploadResult.error });
            setIsSubmitting(false);
            handleCloseCompose();
            router.refresh();
            return;
          }
        } catch (error) {
          logError(error, { action: "handleSubmit:uploadEventCover" });
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
      <EventComposeModal
        key={editingEvent?.id ?? "new"}
        isOpen={isComposeOpen}
        onClose={handleCloseCompose}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        editingEvent={editingEvent}
      />

      <m.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Calendar Strip */}
        <m.section variants={itemVariants} className="premium-surface rounded-2xl overflow-hidden">
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
                  <span className={`text-base font-bold leading-tight mt-0.5 ${isSelected ? "text-background" : ""}`}>
                    {d.day}
                  </span>
                  {hasEvents && !isSelected && (
                    <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-brand-500" />
                  )}
                </m.button>
              );
            })}
          </div>
        </m.section>

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

        {/* Empty State or Event List */}
        {filteredEvents.length === 0 ? (
          <m.div variants={itemVariants} className="py-20 flex flex-col items-center text-center">
            <div className="w-20 h-20 mb-8 rounded-2xl bg-muted/80 flex items-center justify-center">
              <Sparkles size={32} className="text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {selectedCalendarDate ? t("events.noEventsOnDay") : t("events.empty")}
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
          <div className="space-y-10">
            {Array.from(filteredGrouped.entries()).map(([date, dateEvents], groupIndex) => {
              const { label: dateLabel, isSpecial } = formatEventDate(date, t);
              const weekday = getWeekday(date, isJapanese);

              return (
                <m.section key={date} id={`events-${date}`} variants={itemVariants} className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${
                      isSpecial ? "bg-foreground text-background" : "bg-muted"
                    }`}>
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

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {dateEvents.map((event, eventIndex) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        currentUserId={currentUserId}
                        isTeaser={isTeaser}
                        locale={locale}
                        groupIndex={groupIndex}
                        eventIndex={eventIndex}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleAttendance={handleToggleAttendance}
                        onShowAttendees={setShowAttendeesEvent}
                        t={t}
                      />
                    ))}
                  </div>
                </m.section>
              );
            })}
          </div>
        )}
      </m.div>

      {/* FAB */}
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

      <AttendeesModal
        event={showAttendeesEvent}
        onClose={() => setShowAttendeesEvent(null)}
        isTeaser={isTeaser}
      />
    </>
  );
}

// Extracted EventCard for better readability
interface EventCardProps {
  event: EventWithDetails;
  currentUserId: string;
  isTeaser: boolean;
  locale: "ja" | "en";
  groupIndex: number;
  eventIndex: number;
  onEdit: (event: EventWithDetails) => void;
  onDelete: (eventId: string) => void;
  onToggleAttendance: (eventId: string) => void;
  onShowAttendees: (event: EventWithDetails) => void;
  t: ReturnType<typeof useI18n>;
}

function EventCard({
  event,
  currentUserId,
  isTeaser,
  locale,
  groupIndex,
  eventIndex,
  onEdit,
  onDelete,
  onToggleAttendance,
  onShowAttendees,
  t,
}: EventCardProps) {
  const creatorName = event.profiles?.nickname ?? event.profiles?.name ?? t("common.formerResident");
  const isMine = event.user_id === currentUserId;
  const isAttending = event.event_attendees.some((a) => a.user_id === currentUserId);
  const attendeeCount = event.event_attendees.length;
  const isFirstVisible = groupIndex === 0 && eventIndex === 0;
  const coverAlt = getImageAlt.eventCover(event.title, locale);

  return (
    <m.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: groupIndex * 0.08 + eventIndex * 0.05,
      }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="premium-surface rounded-2xl overflow-hidden group"
    >
      {/* Cover image */}
      {event.cover_image_url && (
        isTeaser ? (
          <div className="relative aspect-[1.618/1] bg-muted">
            <Image
              src={event.cover_image_url}
              alt={coverAlt}
              fill
              sizes={IMAGE.coverSizes}
              priority={isFirstVisible}
              placeholder="blur"
              blurDataURL={IMAGE.blurDataURL}
              className="object-cover blur-[3px]"
            />
          </div>
        ) : (
          <Link href={`/events/${event.id}`}>
            <div className="relative aspect-[1.618/1] bg-muted overflow-hidden">
              <Image
                src={event.cover_image_url}
                alt={coverAlt}
                fill
                sizes={IMAGE.coverSizes}
                priority={isFirstVisible}
                placeholder="blur"
                blurDataURL={IMAGE.blurDataURL}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </Link>
        )
      )}

      <div className="p-5 sm:p-6 space-y-4">
        {/* Title row */}
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
                onClick={() => onEdit(event)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                aria-label={t("common.edit")}
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                aria-label={t("common.delete")}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Meta info */}
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

        {/* Description */}
        {event.description && (
          <p className={`text-sm text-muted-foreground leading-relaxed line-clamp-2 ${isTeaser ? "blur-[3px] select-none" : ""}`}>
            {event.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
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
            <span className="text-sm font-medium text-muted-foreground">{creatorName}</span>
          </div>

          <div className="flex items-center gap-3">
            {attendeeCount > 0 && (
              <m.button
                type="button"
                onClick={() => onShowAttendees(event)}
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
              onClick={() => !isTeaser && onToggleAttendance(event.id)}
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
}
