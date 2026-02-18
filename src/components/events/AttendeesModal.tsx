"use client";

import { useId } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, OptimizedAvatarImage } from "@/components/ui/avatar";
import { CloseButton } from "@/components/ui/close-button";
import { useI18n } from "@/hooks/use-i18n";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { EASE_MODAL } from "@/lib/animation";
import { getInitials, getDisplayName } from "@/lib/utils";
import type { EventWithDetails } from "@/domain/event";

interface AttendeesModalProps {
  event: EventWithDetails | null;
  onClose: () => void;
  isTeaser: boolean;
}

export function AttendeesModal({ event, onClose, isTeaser }: AttendeesModalProps) {
  const t = useI18n();
  const id = useId();
  const isOpen = event !== null;

  useEscapeKey(isOpen, onClose);
  useBodyScrollLock(isOpen);

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
            transition={{ duration: 0.25, ease: EASE_MODAL }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm rounded-2xl bg-background premium-surface flex flex-col max-h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <h2 id={`${id}-title`} className="text-sm font-bold text-foreground">
                {t("events.attendeesTitle")}
              </h2>
              <CloseButton onClick={onClose} />
            </div>

            {/* Content */}
            <div className="modal-content">
              {attendees.length === 0 ? (
                <div className="py-8 text-center">
                  <Users size={32} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">{t("events.noAttendees")}</p>
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
                    const displayName = getDisplayName(profile, t("common.unregistered"));
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
