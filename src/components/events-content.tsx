"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Calendar, Plus, X, CalendarDays, Users, Sparkles, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { createEvent, updateEvent, toggleAttendance, deleteEvent } from "@/lib/events/actions";
import { EVENTS } from "@/lib/constants/config";
import { ICON_SIZE, ICON_STROKE } from "@/lib/constants/icons";
import { getInitials } from "@/lib/utils";
import type { EventWithDetails } from "@/domain/event";

interface EventsContentProps {
  events: EventWithDetails[];
  currentUserId: string;
  isTeaser?: boolean;
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


export function EventsContent({ events, currentUserId, isTeaser = false }: EventsContentProps) {
  const t = useI18n();
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const isEditMode = editingEventId !== null;

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

  const resetForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingEventId(null);
    setTitle("");
    setEventDate("");
    setEventTime("");
    setLocation("");
    setDescription("");
  }, []);

  const handleEdit = useCallback((event: EventWithDetails) => {
    setEditingEventId(event.id);
    setTitle(event.title);
    setEventDate(event.event_date);
    setEventTime(event.event_time ?? "");
    setLocation(event.location ?? "");
    setDescription(event.description ?? "");
    setIsFormOpen(true);
    setFeedback(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !eventDate || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      title,
      description: description || null,
      event_date: eventDate,
      event_time: eventTime || null,
      location: location || null,
    };

    const result = editingEventId
      ? await updateEvent(editingEventId, payload)
      : await createEvent(payload);

    setIsSubmitting(false);
    if ("error" in result) {
      setFeedback({ type: "error", message: result.error });
      return;
    }

    resetForm();
    router.refresh();
  }, [title, eventDate, eventTime, location, description, isSubmitting, editingEventId, resetForm, router]);

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
    <div className="space-y-6">
      <div className="premium-surface rounded-3xl p-4 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays size={ICON_SIZE.md} className="text-brand-500" />
            <span className="text-[11px] font-bold tracking-wider uppercase">
              {t("events.nextTwoWeeks")}
            </span>
          </div>
          {selectedCalendarDate && (
            <button
              type="button"
              onClick={() => setSelectedCalendarDate(null)}
              className="text-[10px] font-bold text-brand-500 hover:text-brand-700 tracking-wider uppercase transition-colors"
            >
              {t("events.showAll")}
            </button>
          )}
        </div>

        <div
          ref={calendarRef}
          className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {calendarDates.map((d) => {
            const hasEvents = eventDates.has(d.date);
            const isSelected = selectedCalendarDate === d.date;
            const isWeekend = d.weekday === 0 || d.weekday === 6;
            const weekdays = isJapanese ? WEEKDAYS_JA : WEEKDAYS_EN;

            return (
              <button
                key={d.date}
                id={`date-${d.date}`}
                type="button"
                onClick={() => handleCalendarDateClick(d.date)}
                className={`
                  relative flex-shrink-0 w-12 sm:w-14 py-3 rounded-2xl transition-all duration-300
                  flex flex-col items-center gap-1
                  ${isSelected
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25 scale-105"
                    : hasEvents
                      ? "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100 hover:bg-orange-200 dark:hover:bg-orange-900/50"
                      : d.isToday
                        ? "bg-secondary border-2 border-brand-500/20 text-brand-600 hover:bg-secondary/80"
                        : "bg-secondary/50 hover:bg-secondary text-foreground/80"
                  }
                `}
              >
                <span
                  className={`text-[10px] font-bold tracking-wide ${isSelected
                    ? "text-white/80"
                    : hasEvents
                      ? "text-orange-700 dark:text-orange-300"
                      : isWeekend
                        ? "text-rose-500"
                        : "text-muted-foreground"
                    }`}
                >
                  {weekdays[d.weekday]}
                </span>
                <span
                  className={`text-lg font-bold ${isSelected ? "text-white" : ""
                    }`}
                >
                  {d.day}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!isTeaser && !isFormOpen && (
        <div className="flex justify-end">
          <m.button
            type="button"
            onClick={() => { resetForm(); setIsFormOpen(true); setFeedback(null); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-11 px-6 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-[12px] font-bold tracking-wider uppercase transition-all duration-300 shadow-lg shadow-brand-500/20 flex items-center gap-2"
          >
            <Plus size={ICON_SIZE.md} strokeWidth={ICON_STROKE.medium} />
            {t("events.create")}
          </m.button>
        </div>
      )}

      <AnimatePresence>
        {feedback && (
          <m.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className={`text-sm font-medium px-5 py-4 rounded-2xl border-l-4 shadow-sm ${feedback.type === "success"
              ? "bg-success-bg/50 border-success text-success"
              : "bg-error-bg/50 border-error text-error"
              }`}
          >
            {feedback.message}
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFormOpen && (
          <m.div
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="premium-surface rounded-3xl p-6 sm:p-8 relative">
              <button
                type="button"
                onClick={resetForm}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={ICON_SIZE.md} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isEditMode ? "bg-amber-500/10" : "bg-brand-500/10"}`}>
                  {isEditMode ? (
                    <Pencil size={ICON_SIZE.lg} className="text-amber-500" />
                  ) : (
                    <Calendar size={ICON_SIZE.lg} className="text-brand-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isEditMode ? t("events.edit") : t("events.create")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isEditMode
                      ? t("events.edit")
                      : t("events.createEvent")
                    }
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-muted-foreground tracking-wider uppercase ml-1">
                    {t("events.titleLabel")} <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("events.titlePlaceholder")}
                    maxLength={EVENTS.maxTitleLength}
                    className="w-full h-12 px-4 bg-secondary/50 border border-border rounded-2xl text-foreground text-[15px] font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 focus:bg-card transition-all duration-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-muted-foreground tracking-wider uppercase ml-1">
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
                      className="w-full h-12 px-4 bg-secondary/50 border border-border rounded-2xl text-foreground text-[15px] font-medium focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 focus:bg-card transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-muted-foreground tracking-wider uppercase ml-1">
                      {t("events.timeLabel")}
                    </label>
                    <input
                      type="text"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      placeholder={t("events.timePlaceholder")}
                      className="w-full h-12 px-4 bg-secondary/50 border border-border rounded-2xl text-foreground text-[15px] font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 focus:bg-card transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-muted-foreground tracking-wider uppercase ml-1">
                    {t("events.locationLabel")}
                  </label>
                  <div className="relative">
                    <MapPin size={ICON_SIZE.md} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t("events.locationPlaceholder")}
                      className="w-full h-12 pl-11 pr-4 bg-secondary/50 border border-border rounded-2xl text-foreground text-[15px] font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 focus:bg-card transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-muted-foreground tracking-wider uppercase ml-1">
                    {t("events.descriptionLabel")}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("events.descriptionPlaceholder")}
                    maxLength={EVENTS.maxDescriptionLength}
                    rows={3}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-2xl text-foreground text-[15px] font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 focus:bg-card transition-all duration-300 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-11 px-6 rounded-full text-[12px] font-bold text-muted-foreground hover:text-foreground hover:bg-secondary tracking-wider uppercase transition-all duration-300"
                  >
                    {t("common.cancel")}
                  </button>
                  <m.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!title.trim() || !eventDate || isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`h-11 px-8 rounded-full disabled:bg-secondary disabled:text-muted-foreground text-white text-[12px] font-bold tracking-wider uppercase transition-all duration-300 disabled:shadow-none ${isEditMode
                      ? "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                      : "bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20"
                      }`}
                  >
                    {isSubmitting
                      ? (isEditMode ? t("events.updating") : t("events.creating"))
                      : (isEditMode ? t("events.update") : t("events.create"))
                    }
                  </m.button>
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {filteredEvents.length === 0 ? (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="py-16 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-secondary/80 flex items-center justify-center">
            <Sparkles size={ICON_SIZE["2xl"]} className="text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {selectedCalendarDate
              ? t("events.noEventsOnDay")
              : t("events.empty")
            }
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            {t("events.createAndInvite")}
          </p>
          {!isTeaser && !isFormOpen && (
            <m.button
              type="button"
              onClick={() => setIsFormOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-11 px-6 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-[12px] font-bold tracking-wider uppercase transition-all duration-300 shadow-lg shadow-brand-500/20 inline-flex items-center gap-2"
            >
              <Plus size={ICON_SIZE.md} strokeWidth={ICON_STROKE.medium} />
              {t("events.create")}
            </m.button>
          )}
        </m.div>
      ) : (
        <div className="space-y-8">
          {Array.from(filteredGrouped.entries()).map(([date, dateEvents], groupIndex) => {
            const { label: dateLabel, isSpecial } = formatEventDate(date, t);
            const weekday = getWeekday(date, isJapanese);

            return (
              <div key={date} id={`events-${date}`} className="space-y-4">
                <m.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: groupIndex * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-2xl
                    ${isSpecial
                      ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                      : "bg-secondary"
                    }
                  `}>
                    <span className={`text-lg font-bold ${isSpecial ? "text-white" : "text-foreground"}`}>
                      {dateLabel}
                    </span>
                    <span className={`text-[11px] font-bold ${isSpecial ? "text-white/70" : "text-muted-foreground"}`}>
                      ({weekday})
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-bold text-muted-foreground tracking-wider">
                    {t("events.countLabel", { count: dateEvents.length })}
                  </span>
                </m.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {dateEvents.map((event, eventIndex) => {
                    const creatorName = event.profiles?.nickname ?? event.profiles?.name ?? t("common.formerResident");
                    const isMine = event.user_id === currentUserId;
                    const isAttending = event.event_attendees.some(
                      (a) => a.user_id === currentUserId
                    );
                    const attendeeCount = event.event_attendees.length;

                    return (
                      <m.div
                        key={event.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          ease: [0.23, 1, 0.32, 1],
                          delay: (groupIndex * 0.1) + (eventIndex * 0.08),
                        }}
                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        className="premium-surface rounded-3xl overflow-hidden relative group"
                      >
                        {/* Cover Image */}
                        {event.cover_image_url && (
                          isTeaser ? (
                            <div className="relative aspect-[16/9] bg-muted">
                              <Image
                                src={event.cover_image_url}
                                alt={event.title}
                                fill
                                className="object-cover blur-[3px]"
                              />
                            </div>
                          ) : (
                            <Link href={`/events/${event.id}`}>
                              <div className="relative aspect-[16/9] bg-muted">
                                <Image
                                  src={event.cover_image_url}
                                  alt={event.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            </Link>
                          )
                        )}

                        <div className="p-5 sm:p-6 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            {isTeaser ? (
                              <span className="text-[17px] font-bold text-foreground leading-snug blur-[2.5px] select-none">
                                {event.title}
                              </span>
                            ) : (
                              <Link
                                href={`/events/${event.id}`}
                                className="text-[17px] font-bold text-foreground leading-snug hover:text-brand-600 transition-colors"
                              >
                                {event.title}
                              </Link>
                            )}
                            {isMine && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(event)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                                  aria-label={t("common.edit")}
                                >
                                  <Pencil size={ICON_SIZE.md} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(event.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                  aria-label={t("common.delete")}
                                >
                                  <Trash2 size={ICON_SIZE.md} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {event.event_time && (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/80 rounded-xl text-[12px] font-semibold text-foreground/80 ${isTeaser ? "blur-[2px] select-none" : ""}`}>
                                <Clock size={ICON_SIZE.sm} className="text-brand-500" />
                                {event.event_time}
                              </span>
                            )}
                            {event.location && (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/80 rounded-xl text-[12px] font-semibold text-foreground/80 ${isTeaser ? "blur-[2px] select-none" : ""}`}>
                                <MapPin size={ICON_SIZE.sm} className="text-brand-500" />
                                {event.location}
                              </span>
                            )}
                          </div>

                          {event.description && (
                            <p className={`text-[14px] text-foreground/70 leading-relaxed ${isTeaser ? "blur-[3px] select-none" : ""}`}>
                              {event.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-7 h-7 border border-border shadow-sm">
                                <OptimizedAvatarImage
                                  src={event.profiles?.avatar_url}
                                  alt={creatorName}
                                  context="card"
                                  isBlurred={isTeaser}
                                  fallback={
                                    <AvatarFallback className="text-[9px] font-bold bg-secondary text-muted-foreground">
                                      {getInitials(creatorName)}
                                    </AvatarFallback>
                                  }
                                />
                              </Avatar>
                              <span className="text-[12px] font-semibold text-muted-foreground">
                                {creatorName}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {attendeeCount > 0 && (
                                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-full">
                                  <Users size={ICON_SIZE.sm} />
                                  {attendeeCount}
                                </span>
                              )}
                              <m.button
                                type="button"
                                onClick={() => !isTeaser && handleToggleAttendance(event.id)}
                                disabled={isTeaser}
                                whileHover={!isTeaser ? { scale: 1.05 } : {}}
                                whileTap={!isTeaser ? { scale: 0.95 } : {}}
                                className={`
                                  h-9 px-5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all duration-300
                                  ${isAttending
                                    ? "bg-brand-500/10 text-brand-600 hover:bg-brand-500/20 border border-brand-500/30"
                                    : "bg-brand-500 text-white hover:bg-brand-600 shadow-md shadow-brand-500/20"
                                  }
                                  ${isTeaser ? "opacity-50 cursor-not-allowed" : ""}
                                `}
                              >
                                {isAttending ? t("events.attending") : t("events.attend")}
                              </m.button>
                            </div>
                          </div>
                        </div>
                      </m.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
