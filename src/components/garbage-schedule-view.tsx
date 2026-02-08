"use client";

import { useState, useMemo, useCallback } from "react";
import { m } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { completeDuty } from "@/lib/garbage/actions";
import { DAY_NAMES_JA, DAY_NAMES_EN } from "@/domain/garbage";
import type { GarbageSchedule, GarbageDutyWithProfile } from "@/domain/garbage";

const GARBAGE_TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  可燃ごみ: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  不燃ごみ: { bg: "bg-muted", text: "text-foreground/80", border: "border-border" },
  資源: { bg: "bg-brand-50", text: "text-brand-700", border: "border-brand-200" },
  資源プラスチック: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  資源ごみ: { bg: "bg-brand-50", text: "text-brand-700", border: "border-brand-200" },
};

const DEFAULT_STYLE = { bg: "bg-secondary", text: "text-muted-foreground", border: "border-border" };

interface GarbageScheduleViewProps {
  schedule: GarbageSchedule[];
  duties: GarbageDutyWithProfile[];
  currentUserId: string;
}

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

  const getTypeStyle = (type: string) => GARBAGE_TYPE_STYLES[type] ?? DEFAULT_STYLE;

  return (
    <div className="space-y-6">
      {error && (
        <div className="py-3 px-4 border-l-2 border-error-border bg-error-bg text-sm text-error">
          {error}
        </div>
      )}

      <section>
        <h2 className="text-xs text-muted-foreground tracking-wide uppercase mb-3">
          {t("garbage.weeklySchedule")}
        </h2>

        {schedule.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{t("garbage.noSchedule")}</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {Array.from({ length: 7 }, (_, i) => i).map((dayIndex) => {
              const daySchedule = scheduleByDay.get(dayIndex);
              if (!daySchedule || daySchedule.length === 0) return null;

              return (
                <div
                  key={dayIndex}
                  className="bg-white border border-border rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                        dayIndex === 0
                          ? "bg-red-50 text-red-500"
                          : dayIndex === 6
                            ? "bg-blue-50 text-blue-500"
                            : "bg-secondary text-foreground"
                      }`}
                    >
                      <span className="text-sm font-medium">{dayNames[dayIndex]}</span>
                    </div>

                    {daySchedule.map((entry) => {
                      const style = getTypeStyle(entry.garbage_type);
                      return (
                        <span
                          key={entry.id}
                          className={`inline-flex items-center px-3 py-1.5 text-sm font-medium border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {entry.garbage_type}
                        </span>
                      );
                    })}

                    {daySchedule[0]?.notes && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {daySchedule[0].notes}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-3 tracking-wide">
          {t("garbage.collectionNote")}
        </p>
      </section>

      <section>
        <h2 className="text-xs text-muted-foreground tracking-wide uppercase mb-3">
          {t("garbage.upcomingDuties")}
        </h2>

        {duties.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{t("garbage.noDuties")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {duties.map((duty, index) => {
              const isOwn = duty.user_id === currentUserId;
              const dutyDate = new Date(duty.duty_date + "T00:00:00");
              const dateStr = dutyDate.toLocaleDateString(
                locale === "ja" ? "ja-JP" : "en-US",
                { month: "short", day: "numeric", weekday: "short" }
              );
              const style = getTypeStyle(duty.garbage_type);

              return (
                <m.div
                  key={duty.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                  className={`flex items-center gap-3 px-4 py-3 bg-white border rounded-lg ${
                    isOwn ? "border-foreground" : "border-border"
                  } ${duty.is_completed ? "opacity-50" : ""}`}
                >
                  {isOwn && !duty.is_completed ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleComplete(duty.id)}
                      disabled={completingId === duty.id}
                      className="w-5 h-5 p-0 border-border hover:border-foreground flex-shrink-0"
                      aria-label={t("garbage.markComplete")}
                    >
                      {completingId === duty.id && (
                        <span className="w-2 h-2 bg-slate-400 animate-pulse" />
                      )}
                    </Button>
                  ) : (
                    <div
                      className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${
                        duty.is_completed ? "bg-secondary border border-border" : ""
                      }`}
                    >
                      {duty.is_completed && (
                        <span className="text-[10px] text-muted-foreground">✓</span>
                      )}
                    </div>
                  )}

                  {duty.profile?.avatar_url ? (
                    <Image
                      src={duty.profile.avatar_url}
                      alt={duty.profile.name}
                      width={24}
                      height={24}
                      className="rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] text-muted-foreground">
                        {duty.profile?.name?.[0] ?? "?"}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm ${
                        isOwn ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {duty.profile?.name || t("garbage.unknownUser")}
                    </span>
                    {isOwn && (
                      <span className="text-[10px] text-muted-foreground ml-1">
                        ({t("garbage.you")})
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 border ${style.bg} ${style.text} ${style.border} flex-shrink-0`}
                  >
                    {duty.garbage_type}
                  </span>

                  <span className="text-xs text-muted-foreground flex-shrink-0">{dateStr}</span>
                </m.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
