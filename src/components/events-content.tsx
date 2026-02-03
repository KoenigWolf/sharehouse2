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

export function EventsContent({ events, currentUserId }: EventsContentProps) {
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div />
        {!isFormOpen && (
          <button
            type="button"
            onClick={() => { setIsFormOpen(true); setFeedback(null); }}
            className="text-xs text-white bg-zinc-900 hover:bg-zinc-700 px-3 py-1.5 rounded-md transition-colors"
          >
            {t("events.create")}
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
            className={`text-xs px-3 py-2 mb-4 border-l-2 ${
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
        {isFormOpen && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-6"
          >
            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  {t("events.titleLabel")}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("events.titlePlaceholder")}
                  maxLength={EVENTS.maxTitleLength}
                  className="w-full h-10 px-3 text-sm text-zinc-900 placeholder:text-zinc-300 border border-zinc-200 rounded-md focus:border-zinc-900 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">
                    {t("events.dateLabel")}
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full h-10 px-3 text-sm text-zinc-900 border border-zinc-200 rounded-md focus:border-zinc-900 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">
                    {t("events.timeLabel")}
                  </label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder={t("events.timePlaceholder")}
                    className="w-full h-10 px-3 text-sm text-zinc-900 placeholder:text-zinc-300 border border-zinc-200 rounded-md focus:border-zinc-900 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  {t("events.locationLabel")}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("events.locationPlaceholder")}
                  className="w-full h-10 px-3 text-sm text-zinc-900 placeholder:text-zinc-300 border border-zinc-200 rounded-md focus:border-zinc-900 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  {t("events.descriptionLabel")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("events.descriptionPlaceholder")}
                  maxLength={EVENTS.maxDescriptionLength}
                  rows={2}
                  className="w-full px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-300 border border-zinc-200 rounded-md focus:border-zinc-900 focus:outline-none resize-none transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setTitle(""); setEventDate(""); setEventTime("");
                    setLocation(""); setDescription("");
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-600 px-3 py-1.5 transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!title.trim() || !eventDate || isSubmitting}
                  className="text-xs text-white bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-300 px-3 py-1.5 rounded-md transition-colors"
                >
                  {isSubmitting ? t("events.creating") : t("events.create")}
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {events.length === 0 ? (
        <p className="text-xs text-zinc-400 py-8 text-center">{t("events.empty")}</p>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([date, dateEvents]) => (
            <div key={date}>
              <h3 className="text-xs font-medium text-zinc-400 mb-3">
                {formatEventDate(date, t)}
              </h3>
              <div className="space-y-3">
                {dateEvents.map((event) => {
                  const creatorName = event.profiles?.nickname || event.profiles?.name || "";
                  const isMine = event.user_id === currentUserId;
                  const isAttending = event.event_attendees.some(
                    (a) => a.user_id === currentUserId
                  );
                  const attendeeCount = event.event_attendees.length;

                  return (
                    <m.div
                      key={event.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="border border-zinc-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-zinc-900">
                          {event.title}
                        </h4>
                        {isMine && (
                          <button
                            type="button"
                            onClick={() => handleDelete(event.id)}
                            className="text-[10px] text-zinc-300 hover:text-zinc-500 transition-colors shrink-0 ml-2"
                          >
                            {t("common.delete")}
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-zinc-500 mb-3">
                        {event.event_time && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {event.event_time}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {event.location}
                          </span>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                          {event.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs">
                        <Avatar className="w-5 h-5 rounded-full">
                          <OptimizedAvatarImage
                            src={event.profiles?.avatar_url}
                            alt={creatorName}
                            context="card"
                            fallback={
                              <span className="text-[8px] text-zinc-400">
                                {getInitials(creatorName)}
                              </span>
                            }
                            fallbackClassName="bg-zinc-50"
                          />
                        </Avatar>
                        <span className="text-zinc-400">
                          {t("events.createdBy", { name: creatorName })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
                        <span className="text-xs text-zinc-400">
                          {attendeeCount > 0
                            ? t("events.attendees", { count: attendeeCount })
                            : t("events.noAttendees")}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleAttendance(event.id)}
                          className={`text-xs px-3 py-1 rounded-md transition-colors ${
                            isAttending
                              ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                              : "bg-zinc-900 text-white hover:bg-zinc-700"
                          }`}
                        >
                          {isAttending ? t("events.attending") : t("events.attend")}
                        </button>
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
