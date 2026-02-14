"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Calendar, Plus, X, CalendarDays, Users, Sparkles, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, OptimizedAvatarImage } from "@/components/ui/avatar";
import { TimeSelect } from "@/components/ui/time-select";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { createEvent, updateEvent, toggleAttendance, deleteEvent } from "@/lib/events/actions";
import { EVENTS } from "@/lib/constants/config";
import { getInitials } from "@/lib/utils";
import type { EventWithDetails } from "@/domain/event";

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

  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current || !initialEditEventId) return;
    hasInitializedRef.current = true;

    const eventToEdit = events.find((e) => e.id === initialEditEventId);
    if (eventToEdit) {
      setTimeout(() => handleEdit(eventToEdit), 0);
    }
  }, [initialEditEventId, events, handleEdit]);

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
    // Main container: Golden ratio vertical rhythm (space-y-8 ≈ 32px)
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          CALENDAR STRIP
          - Touch targets: 48px minimum (Fitts' Law)
          - Visual hierarchy: Today > Selected > HasEvents > Default
          - Golden ratio: padding 20px (≈ 21 Fibonacci)
      ═══════════════════════════════════════════════════════════════════ */}
      <m.section
        variants={itemVariants}
        className="premium-surface rounded-2xl sm:rounded-3xl overflow-hidden"
      >
        {/* Header with clear visual hierarchy */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <CalendarDays size={16} className="text-brand-500" />
            </div>
            <span className="text-xs font-semibold tracking-wide text-foreground/80">
              {t("events.nextTwoWeeks")}
            </span>
          </div>
          {selectedCalendarDate && (
            <button
              type="button"
              onClick={() => setSelectedCalendarDate(null)}
              className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-500/5"
            >
              {t("events.showAll")}
            </button>
          )}
        </div>

        {/* Calendar scroll area with better proportions */}
        <div
          ref={calendarRef}
          className="flex gap-1.5 sm:gap-2 overflow-x-auto px-4 sm:px-5 pb-5 scrollbar-hide"
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative flex-shrink-0 w-[52px] sm:w-14 py-3 rounded-xl sm:rounded-2xl
                  flex flex-col items-center justify-center gap-0.5
                  transition-all duration-200
                  ${isSelected
                    ? "bg-foreground text-background shadow-lg"
                    : d.isToday
                      ? "bg-brand-500/10 ring-2 ring-brand-500/30 text-foreground"
                      : "bg-muted/50 hover:bg-muted text-foreground"
                  }
                `}
              >
                {/* Weekday label */}
                <span
                  className={`text-[10px] font-semibold tracking-wide ${
                    isSelected
                      ? "text-background/70"
                      : isWeekend
                        ? "text-foreground/60"
                        : "text-muted-foreground"
                  }`}
                >
                  {weekdays[d.weekday]}
                </span>

                {/* Day number - larger for better readability */}
                <span className={`text-lg font-bold leading-none ${isSelected ? "text-background" : ""}`}>
                  {d.day}
                </span>

                {/* Event indicator dot - subtle but clear */}
                {hasEvents && !isSelected && (
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500" />
                )}
              </m.button>
            );
          })}
        </div>
      </m.section>

      {/* ═══════════════════════════════════════════════════════════════════
          CREATE BUTTON - Floating action position
      ═══════════════════════════════════════════════════════════════════ */}
      {!isTeaser && !isFormOpen && (
        <m.div variants={itemVariants} className="flex justify-end">
          <m.button
            type="button"
            onClick={() => { resetForm(); setIsFormOpen(true); setFeedback(null); }}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="h-12 px-7 rounded-full bg-foreground text-background text-sm font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2.5"
          >
            <Plus size={18} strokeWidth={2.5} />
            {t("events.create")}
          </m.button>
        </m.div>
      )}

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
          EVENT CREATION FORM
          - Grouped fields by relationship
          - Golden ratio spacing (space-y-6 ≈ 24px)
          - Clear visual hierarchy
      ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isFormOpen && (
          <m.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="premium-surface rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative">
              {/* Close button */}
              <button
                type="button"
                onClick={resetForm}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>

              {/* Form header */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isEditMode ? "bg-amber-500/10" : "bg-brand-500/10"}`}>
                  {isEditMode ? (
                    <Pencil size={22} className="text-amber-500" />
                  ) : (
                    <Calendar size={22} className="text-brand-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {isEditMode ? t("events.edit") : t("events.create")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isEditMode ? t("events.edit") : t("events.createEvent")}
                  </p>
                </div>
              </div>

              {/* Form fields with golden ratio spacing */}
              <div className="space-y-6">
                {/* Title - Primary field, full width */}
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
                    className="w-full h-13 px-5 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 focus:bg-background transition-all duration-200"
                  />
                </div>

                {/* Date & Time - Grouped related fields */}
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

                {/* Location - Secondary info */}
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

                {/* Description - Tertiary info */}
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

                {/* Action buttons - Clear visual hierarchy */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-12 px-6 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
                  >
                    {t("common.cancel")}
                  </button>
                  <m.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!title.trim() || !eventDate || isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`h-12 px-8 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                      isEditMode
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : "bg-foreground hover:bg-foreground/90 text-background"
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
          </m.section>
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
          {!isTeaser && !isFormOpen && (
            <m.button
              type="button"
              onClick={() => setIsFormOpen(true)}
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
                              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-lg">
                                  <Users size={14} />
                                  {attendeeCount}
                                </span>
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
  );
}
