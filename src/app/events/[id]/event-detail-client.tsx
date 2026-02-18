"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Pencil,
  Trash2,
  ImagePlus,
  Clock,
  X,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { TimeSelect } from "@/components/ui/time-select";
import { getInitials, formatDate } from "@/lib/utils/formatting";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { useUser } from "@/hooks/use-user";
import {
  toggleAttendance,
  deleteEvent,
  uploadEventCover,
  removeEventCover,
  updateEvent,
} from "@/lib/events/actions";
import { FILE_UPLOAD, EVENTS, IMAGE } from "@/lib/constants/config";
import { prepareImageForUpload } from "@/lib/utils/image-compression";
import { logError } from "@/lib/errors";
import { getImageAlt } from "@/lib/utils/accessibility";
import type { EventWithDetails } from "@/domain/event";

interface EventDetailClientProps {
  initialEvent: EventWithDetails;
}

export function EventDetailClient({ initialEvent }: EventDetailClientProps) {
  const router = useRouter();
  const t = useI18n();
  const locale = useLocale();
  const { userId } = useUser();

  const [event, setEvent] = useState<EventWithDetails>(initialEvent);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(event.title);
  const [editDate, setEditDate] = useState(event.event_date);
  const [editTime, setEditTime] = useState(event.event_time ?? "");
  const [editLocation, setEditLocation] = useState(event.location ?? "");
  const [editDescription, setEditDescription] = useState(event.description ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = event.user_id === userId;
  const isAttending = event.event_attendees.some((a) => a.user_id === userId);

  const handleToggleAttendance = async () => {
    if (!userId) return;
    setIsToggling(true);
    setError(null);

    const result = await toggleAttendance(event.id);
    if ("error" in result) {
      setError(result.error);
    } else {
      // Update local state immediately for responsive UI
      if (isAttending) {
        setEvent(prev => ({
          ...prev,
          event_attendees: prev.event_attendees.filter(a => a.user_id !== userId)
        }));
      } else {
        setEvent(prev => ({
          ...prev,
          event_attendees: [...prev.event_attendees, { user_id: userId, profiles: null }]
        }));
      }
      // Sync with server in background
      router.refresh();
    }
    setIsToggling(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(t("events.deleteConfirm"))) return;
    setIsDeleting(true);
    const result = await deleteEvent(event.id);
    if ("error" in result) {
      setError(result.error);
      setIsDeleting(false);
    } else {
      router.push("/events");
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setError(null);

    try {
      // Compress and convert to WebP/JPEG (handles HEIC/HEIF)
      const prepared = await prepareImageForUpload(file);

      const formData = new FormData();
      formData.append("cover", prepared.file);

      const result = await uploadEventCover(event.id, formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setEvent((prev) => ({ ...prev, cover_image_url: result.url }));
      }
    } catch (err) {
      logError(err, { action: "handleCoverUpload:compress" });
      setError(t("errors.uploadFailed"));
    }

    setIsUploadingCover(false);
    e.target.value = "";
  };

  const handleRemoveCover = async () => {
    setError(null);
    setIsUploadingCover(true);
    const result = await removeEventCover(event.id);
    if ("error" in result) {
      setError(result.error);
    } else {
      setEvent((prev) => ({ ...prev, cover_image_url: null }));
    }
    setIsUploadingCover(false);
  };

  const handleStartEdit = () => {
    setEditTitle(event.title);
    setEditDate(event.event_date);
    setEditTime(event.event_time ?? "");
    setEditLocation(event.location ?? "");
    setEditDescription(event.description ?? "");
    setIsEditing(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editDate || isSaving) return;
    setIsSaving(true);
    setError(null);

    const result = await updateEvent(event.id, {
      title: editTitle,
      description: editDescription || null,
      event_date: editDate,
      event_time: editTime || null,
      location: editLocation || null,
    });

    if ("error" in result) {
      setError(result.error);
    } else {
      setEvent((prev) => ({
        ...prev,
        title: editTitle,
        description: editDescription || null,
        event_date: editDate,
        event_time: editTime || null,
        location: editLocation || null,
      }));
      setIsEditing(false);
      router.refresh();
    }
    setIsSaving(false);
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const creatorName = event.profiles?.nickname || event.profiles?.name || t("events.unknownCreator");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-24 sm:pb-8">
        <div className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            {t("events.backToList")}
          </Link>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-bg border border-error-border">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <m.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {(event.cover_image_url || isOwner) && (
              <div className="relative aspect-[2/1] sm:aspect-[5/2] rounded-2xl overflow-hidden bg-muted">
                {event.cover_image_url ? (
                  <Image
                    src={event.cover_image_url}
                    alt={getImageAlt.eventCover(event.title, locale)}
                    fill
                    sizes="(min-width: 896px) 896px, 100vw"
                    className="object-cover"
                    priority
                    placeholder="blur"
                    blurDataURL={IMAGE.blurDataURL}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-brand-50">
                    <Calendar size={48} strokeWidth={1} className="text-brand-200" />
                  </div>
                )}

                {isOwner && (
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    {event.cover_image_url && (
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        disabled={isUploadingCover}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept={FILE_UPLOAD.inputAccept}
                        onChange={handleCoverUpload}
                        className="hidden"
                        disabled={isUploadingCover}
                      />
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground transition-colors">
                        {isUploadingCover ? <Spinner size="xs" /> : <ImagePlus size={16} />}
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}

            <div className="premium-surface rounded-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <m.div
                    key="edit-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 sm:p-8 border-b border-border"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                          <Pencil size={20} className="text-amber-500" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground">
                          {t("events.edit")}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="w-8 h-8 rounded-full bg-secondary hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-muted-foreground tracking-wider uppercase ml-1">
                          {t("events.titleLabel")} <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
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
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full h-12 px-4 bg-secondary/50 border border-border rounded-2xl text-foreground text-[15px] font-medium focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 focus:bg-card transition-all duration-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-bold text-muted-foreground tracking-wider uppercase ml-1">
                            {t("events.timeLabel")}
                          </label>
                          <TimeSelect
                            value={editTime}
                            onChange={setEditTime}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-muted-foreground tracking-wider uppercase ml-1">
                          {t("events.locationLabel")}
                        </label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                          <input
                            type="text"
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
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
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder={t("events.descriptionPlaceholder")}
                          maxLength={EVENTS.maxDescriptionLength}
                          rows={3}
                          className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-2xl text-foreground text-[15px] font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 focus:bg-card transition-all duration-300 resize-none leading-relaxed"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-3">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="h-11 px-6 rounded-full text-[12px] font-bold text-muted-foreground hover:text-foreground hover:bg-secondary tracking-wider uppercase transition-all duration-300"
                        >
                          {t("common.cancel")}
                        </button>
                        <m.button
                          type="button"
                          onClick={handleSaveEdit}
                          disabled={!editTitle.trim() || !editDate || isSaving}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="h-11 px-8 rounded-full bg-amber-500 hover:bg-amber-600 disabled:bg-secondary disabled:text-muted-foreground text-white text-[12px] font-bold tracking-wider uppercase transition-all duration-300 shadow-lg shadow-amber-500/20 disabled:shadow-none"
                        >
                          {isSaving ? t("events.updating") : t("events.update")}
                        </m.button>
                      </div>
                    </div>
                  </m.div>
                ) : (
                  <m.div
                    key="view-mode"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-6 sm:p-8 border-b border-border">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                          {event.title}
                        </h1>
                        {isOwner && (
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={handleStartEdit}
                              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={handleDelete}
                              disabled={isDeleting}
                              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-error hover:bg-error-bg transition-colors"
                            >
                              {isDeleting ? <Spinner size="xs" /> : <Trash2 size={18} />}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-foreground">
                          <Calendar size={16} className="text-brand-500 shrink-0" />
                          <span>{formatDate(event.event_date, dateOptions, undefined)}</span>
                        </div>
                        {event.event_time && (
                          <div className="flex items-center gap-2 text-foreground">
                            <Clock size={16} className="text-brand-500 shrink-0" />
                            <span>{event.event_time}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2 text-foreground">
                            <MapPin size={16} className="text-brand-500 shrink-0" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {event.description && (
                      <div className="p-6 sm:p-8 border-b border-border">
                        <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    )}
                  </m.div>
                )}
              </AnimatePresence>

              <div className="p-6 sm:p-8 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {t("events.createdByLabel")}
                </p>
                <Link
                  href={event.user_id ? `/profile/${event.user_id}` : "#"}
                  className="inline-flex items-center gap-3 group"
                >
                  <Avatar className="w-10 h-10 border border-border">
                    <OptimizedAvatarImage
                      src={event.profiles?.avatar_url}
                      alt={creatorName}
                      context="card"
                      fallback={getInitials(creatorName)}
                    />
                  </Avatar>
                  <span className="font-medium text-foreground group-hover:text-brand-600 transition-colors">
                    {creatorName}
                  </span>
                </Link>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={18} className="text-brand-500" />
                  <h2 className="font-semibold text-foreground">
                    {t("events.attendees", { count: event.event_attendees.length })}
                  </h2>
                </div>

                {event.event_attendees.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {event.event_attendees.map((attendee) => {
                      const name = attendee.profiles?.nickname || attendee.profiles?.name || t("events.unknownAttendee");
                      return (
                        <Link
                          key={attendee.user_id}
                          href={`/profile/${attendee.user_id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <Avatar className="w-6 h-6">
                            <OptimizedAvatarImage
                              src={attendee.profiles?.avatar_url}
                              alt={name}
                              context="card"
                              fallback={getInitials(name)}
                            />
                          </Avatar>
                          <span className="text-sm font-medium text-foreground">{name}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("events.noAttendees")}</p>
                )}
              </div>
            </div>

            {userId && (
              <Button
                onClick={handleToggleAttendance}
                disabled={isToggling}
                variant={isAttending ? "secondary" : "default"}
                className="w-full h-12 rounded-xl text-base font-semibold"
              >
                {isToggling ? (
                  <Spinner size="sm" />
                ) : isAttending ? (
                  t("events.attending")
                ) : (
                  t("events.attend")
                )}
              </Button>
            )}
          </m.article>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
