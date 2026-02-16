"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { Check, User, Calendar } from "lucide-react";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { completeDuty } from "@/lib/garbage/actions";
import { DAY_NAMES_JA, DAY_NAMES_EN } from "@/domain/garbage";
import type { GarbageSchedule, GarbageDutyWithProfile } from "@/domain/garbage";
import { cn } from "@/lib/utils";

const GARBAGE_TYPE_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  可燃ごみ: {
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200/50 dark:border-rose-800/50",
  },
  不燃ごみ: {
    bg: "bg-slate-500/10",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200/50 dark:border-slate-700/50",
  },
  資源: {
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200/50 dark:border-blue-800/50",
  },
  資源プラスチック: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200/50 dark:border-yellow-700/50",
  },
  資源ごみ: {
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200/50 dark:border-blue-800/50",
  },
};

const DEFAULT_STYLE = {
  bg: "bg-muted/50",
  text: "text-muted-foreground",
  border: "border-border/50",
};

interface GarbageScheduleViewProps {
  schedule: GarbageSchedule[];
  duties: GarbageDutyWithProfile[];
  currentUserId: string;
}

const WeekRow = memo(function WeekRow({
  schedule,
  todayIndex,
  dayNames,
}: {
  schedule: Map<number, GarbageSchedule[]>;
  todayIndex: number;
  dayNames: readonly string[];
}) {
  const getTypeStyle = (type: string) => GARBAGE_TYPE_STYLES[type] ?? DEFAULT_STYLE;

  return (
    <div className="relative">
      {/* Scroll hint gradient for mobile - disappears when scrolled to end if implemented with JS, but CSS-only usually just overlay */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 scrollbar-hide">
        <div className="grid grid-cols-7 gap-px bg-border/40 rounded-lg overflow-hidden border border-border/40 min-w-[600px] sm:min-w-0">
          {Array.from({ length: 7 }, (_, i) => i).map((dayIndex) => {
            const items = schedule.get(dayIndex) ?? [];
            const isToday = dayIndex === todayIndex;

            return (
              <div
                key={dayIndex}
                className={cn(
                  "bg-card p-2 sm:p-3 min-h-[80px] sm:min-h-[100px] flex flex-col gap-2",
                  isToday && "bg-primary/5"
                )}
              >
                <div className={cn(
                  "text-xs font-bold text-center mb-1",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {dayNames[dayIndex]}
                </div>

                <div className="flex flex-col gap-1.5 flex-1">
                  {items.map((item) => {
                    const style = getTypeStyle(item.garbage_type);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "text-[10px] sm:text-xs font-medium px-1.5 py-1 rounded border break-words leading-tight text-center",
                          style.bg,
                          style.text,
                          style.border
                        )}
                      >
                        {item.garbage_type}
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Mobile scroll hint text */}
      <p className="sm:hidden text-[10px] text-muted-foreground text-center mt-1">
        ← Swipe to see full week →
      </p>
    </div>
  );
});
WeekRow.displayName = "WeekRow";

interface DutyRowProps {
  duty: GarbageDutyWithProfile;
  isOwn: boolean;
  dateStr: string;
  onComplete: (id: string) => void;
  isCompleting: boolean;
}

const DutyRow = memo(function DutyRow({
  duty,
  isOwn,
  dateStr,
  onComplete,
  isCompleting,
}: DutyRowProps) {
  const t = useI18n();
  const style = GARBAGE_TYPE_STYLES[duty.garbage_type] ?? DEFAULT_STYLE;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 sm:gap-4 py-3 border-b border-border/40 last:border-0",
        duty.is_completed && "opacity-50 grayscale"
      )}
    >
      <div className="w-10 sm:w-12 text-xs font-mono text-muted-foreground flex-shrink-0">
        {dateStr}
      </div>

      <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <OptimizedAvatarImage
            src={duty.profile?.avatar_url}
            alt={duty.profile?.name ?? t("garbage.unknownUser")}
            context="card"
            className="object-cover w-full h-full"
            fallback={<User size={14} className="text-muted-foreground" />}
            fallbackClassName="bg-muted w-full h-full flex items-center justify-center"
          />
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={cn("text-sm font-medium truncate", isOwn && "text-primary font-bold")}>
              {duty.profile?.name ?? t("garbage.unknownUser")}
            </span>
            {isOwn && <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded font-bold flex-shrink-0">{t("residents.badgeYou")}</span>}
          </div>
        </div>
      </div>

      <span
        className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap flex-shrink-0",
          style.bg, style.text, style.border
        )}
      >
        {duty.garbage_type}
      </span>

      {isOwn && !duty.is_completed ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onComplete(duty.id)}
          disabled={isCompleting}
          className="h-8 rounded-full px-3 text-xs flex-shrink-0"
        >
          {isCompleting ? t("common.processing") : t("garbage.markComplete")}
        </Button>
      ) : (
        <div className="w-8 flex justify-center">
          {duty.is_completed && <Check size={16} className="text-green-500" />}
        </div>
      )}
    </div>
  );
});
DutyRow.displayName = "DutyRow";

export function GarbageScheduleView({
  schedule,
  duties,
  currentUserId,
}: GarbageScheduleViewProps) {
  const t = useI18n();
  const locale = useLocale();
  const dayNames = locale === "ja" ? DAY_NAMES_JA : DAY_NAMES_EN;
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const today = new Date().getDay();

  const scheduleByDay = useMemo(() => {
    const grouped = new Map<number, GarbageSchedule[]>();
    for (const entry of schedule) {
      const existing = grouped.get(entry.day_of_week) ?? [];
      existing.push(entry);
      grouped.set(entry.day_of_week, existing);
    }
    return grouped;
  }, [schedule]);

  const handleComplete = useCallback(async (dutyId: string) => {
    setCompletingId(dutyId);
    setError("");

    const result = await completeDuty(dutyId);
    if ("error" in result) {
      setError(result.error);
    }
    setCompletingId(null);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {error && (
        <div className="col-span-full py-3 px-4 rounded bg-error-bg/50 text-sm text-error">
          {error}
        </div>
      )}

      {/* Weekly Schedule - Left Column */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-muted-foreground" />
          <h3 className="font-semibold">{t("garbage.weeklySchedule")}</h3>
        </div>

        <WeekRow schedule={scheduleByDay} todayIndex={today} dayNames={dayNames} />

        <p className="text-[10px] text-muted-foreground mt-2">
          {t("garbage.collectionNote")}
        </p>
      </section>

      {/* Duties - Right Column */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={18} className="text-muted-foreground" />
            <h3 className="font-semibold">{t("garbage.upcomingDuties")}</h3>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/60">
          {duties.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {t("garbage.noDuties")}
            </div>
          ) : (
            <div className="px-4">
              {duties.map((duty) => {
                const isOwn = duty.user_id === currentUserId;
                const dutyDate = new Date(duty.duty_date + "T00:00:00");
                const dateStr = dutyDate.toLocaleDateString(
                  locale === "ja" ? "ja-JP" : "en-US",
                  { month: "short", day: "numeric" }
                );

                return (
                  <DutyRow
                    key={duty.id}
                    duty={duty}
                    isOwn={isOwn}
                    dateStr={dateStr}
                    onComplete={handleComplete}
                    isCompleting={completingId === duty.id}
                  />
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
