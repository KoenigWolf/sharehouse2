"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { MapPin, Clock } from "lucide-react";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/hooks/use-i18n";
import { createEvent, toggleAttendance, deleteEvent } from "@/lib/events/actions";
import { EVENTS } from "@/lib/constants/config";
import { getInitials } from "@/lib/utils";
import type { EventWithDetails } from "@/domain/event";

interface EventsContentProps {
  events: EventWithDetails[];
  currentUserId: string;
  isTeaser?: boolean;
}

function formatEventDate(dateStr: string, t: ReturnType<typeof useI18n>): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateStr + "T00:00:00");

  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t("events.today");
  if (diffDays === 1) return t("events.tomorrow");

  const month = eventDate.getMonth() + 1;
  const day = eventDate.getDate();
  return `${month}/${day}`;
}

function groupEventsByDate(events: EventWithDetails[]): Map<string, EventWithDetails[]> {
  const grouped = new Map<string, EventWithDetails[]>();
  for (const event of events) {
    const existing = grouped.get(event.event_date) || [];
    existing.push(event);
    grouped.set(event.event_date, existing);
  }
  return grouped;
}

export function EventsContent({ events, currentUserId, isTeaser = false }: EventsContentProps) {
  const t = useI18n();
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const grouped = useMemo(() => groupEventsByDate(events), [events]);

  const handleCreate = useCallback(async () => {
    if (!title.trim() || !eventDate || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);

    const result = await createEvent({
      title,
      description: description || null,
      event_date: eventDate,
      event_time: eventTime || null,
      location: location || null,
    });

    setIsSubmitting(false);
    if ("error" in result) {
      setFeedback({ type: "error", message: result.error });
      return;
    }

    setIsFormOpen(false);
    setTitle("");
    setEventDate("");
    setEventTime("");
    setLocation("");
    setDescription("");
    router.refresh();
  }, [title, eventDate, eventTime, location, description, isSubmitting, router]);

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

  return (
    <div className="space-y-8">
      {!isFormOpen && !isTeaser && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { setIsFormOpen(true); setFeedback(null); }}
            className="h-9 px-5 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold tracking-wider uppercase transition-all duration-300 shadow-sm shadow-brand-100"
          >
            {t("events.create")}
          </button>
        </div>
      )}

      <AnimatePresence>
        {feedback && (
          <m.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`text-xs font-medium px-4 py-3 rounded-xl border-l-4 shadow-sm ${feedback.type === "success"
              ? "bg-success-bg/50 border-success-border text-success"
              : "bg-error-bg/50 border-error-border text-error"
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
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="premium-surface rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                  {t("events.titleLabel")}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("events.titlePlaceholder")}
                  maxLength={EVENTS.maxTitleLength}
                  className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all duration-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    {t("events.dateLabel")}
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    {t("events.timeLabel")}
                  </label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder={t("events.timePlaceholder")}
                    className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                  {t("events.locationLabel")}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("events.locationPlaceholder")}
                  className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                  {t("events.descriptionLabel")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("events.descriptionPlaceholder")}
                  maxLength={EVENTS.maxDescriptionLength}
                  rows={2}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all duration-300 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setTitle(""); setEventDate(""); setEventTime("");
                    setLocation(""); setDescription("");
                  }}
                  className="h-10 px-6 rounded-full text-[11px] font-bold text-slate-400 hover:text-slate-600 tracking-wider uppercase transition-all duration-300"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!title.trim() || !eventDate || isSubmitting}
                  className="h-10 px-8 rounded-full bg-brand-600 hover:bg-brand-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-[11px] font-bold tracking-wider uppercase transition-all duration-300 shadow-sm shadow-brand-100"
                >
                  {isSubmitting ? t("events.creating") : t("events.create")}
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {events.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-slate-400 font-medium">{t("events.empty")}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Array.from(grouped.entries()).map(([date, dateEvents], groupIndex) => (
            <div key={date} className="space-y-5">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase whitespace-nowrap">
                  {formatEventDate(date, t)}
                </h3>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dateEvents.map((event, eventIndex) => {
                  const creatorName = event.profiles?.nickname ?? event.profiles?.name ?? "";
                  const isMine = event.user_id === currentUserId;
                  const isAttending = event.event_attendees.some(
                    (a) => a.user_id === currentUserId
                  );
                  const attendeeCount = event.event_attendees.length;

                  return (
                    <m.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: (groupIndex * 0.1) + (eventIndex * 0.05) }}
                      className="premium-surface rounded-3xl p-6 relative group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className={`text-base font-bold text-slate-900 tracking-tight ${isTeaser ? "blur-[2.5px] select-none" : ""}`}>
                          {event.title}
                        </h4>
                        {isMine && (
                          <button
                            type="button"
                            onClick={() => handleDelete(event.id)}
                            className="text-[10px] font-bold text-slate-300 hover:text-rose-500 tracking-widest uppercase transition-all"
                          >
                            {t("common.delete")}
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-[11px] font-semibold text-slate-500 mb-4">
                        {event.event_time && (
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg ${isTeaser ? "blur-[2px] select-none" : ""}`}>
                            <Clock size={12} className="text-brand-500" />
                            {event.event_time}
                          </span>
                        )}
                        {event.location && (
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg ${isTeaser ? "blur-[2px] select-none" : ""}`}>
                            <MapPin size={12} className="text-brand-500" />
                            {event.location}
                          </span>
                        )}
                      </div>

                      {event.description && (
                        <p className={`text-sm text-slate-600 mb-5 leading-relaxed font-medium ${isTeaser ? "blur-[3px] select-none" : ""}`}>
                          {event.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-6 h-6 rounded-lg border border-slate-100 shadow-sm overflow-hidden">
                            <OptimizedAvatarImage
                              src={event.profiles?.avatar_url}
                              alt={creatorName}
                              context="card"
                              isBlurred={isTeaser}
                              fallback={
                                <span className="text-[9px] font-bold text-slate-400">
                                  {getInitials(creatorName)}
                                </span>
                              }
                              fallbackClassName="bg-slate-50"
                            />
                          </Avatar>
                          <span className="text-[11px] font-bold text-slate-400 tracking-wide">
                            {creatorName}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                            {attendeeCount > 0
                              ? t("events.attendees", { count: attendeeCount })
                              : t("events.noAttendees")}
                          </span>
                          <button
                            type="button"
                            onClick={() => !isTeaser && handleToggleAttendance(event.id)}
                            disabled={isTeaser}
                            className={`h-8 px-4 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${isAttending
                              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              : "bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-100"
                              } ${isTeaser ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {isAttending ? t("events.attending") : t("events.attend")}
                          </button>
                        </div>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
