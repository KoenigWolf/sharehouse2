"use client";

import { useState, useMemo, useCallback } from "react";
import { m } from "framer-motion";
import Image from "next/image";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { completeDuty } from "@/lib/garbage/actions";
import {
  DAY_NAMES_JA,
  DAY_NAMES_EN,
} from "@/domain/garbage";
import type {
  GarbageSchedule,
  GarbageDutyWithProfile,
} from "@/domain/garbage";

interface GarbageScheduleViewProps {
  schedule: GarbageSchedule[];
  duties: GarbageDutyWithProfile[];
  currentUserId: string;
}

/**
 * ゴミ出しスケジュール表示コンポーネント
 *
 * 曜日別のゴミ出し予定と直近の当番一覧を表示する。
 * 自分の当番には完了ボタンを表示し、completeDutyで完了処理を行う。
 *
 * @param props.schedule - 曜日別ゴミ出しスケジュール
 * @param props.duties - 直近の当番（プロフィール付き）
 * @param props.currentUserId - ログインユーザーのID
 */
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

  // 曜日別にスケジュールをグループ化
  const scheduleByDay = useMemo(() => {
    const grouped = new Map<number, GarbageSchedule[]>();
    for (const entry of schedule) {
      const existing = grouped.get(entry.day_of_week) ?? [];
      existing.push(entry);
      grouped.set(entry.day_of_week, existing);
    }
    return grouped;
  }, [schedule]);

  const handleComplete = useCallback(
    async (dutyId: string) => {
      setCompletingId(dutyId);
      setError("");

      const result = await completeDuty(dutyId);
      if ("error" in result) {
        setError(result.error);
      }
      setCompletingId(null);
    },
    []
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="py-3 px-4 border border-red-200 bg-red-50 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 曜日別スケジュール */}
      <section>
        <h2 className="text-xs text-[#a3a3a3] tracking-wide mb-3">
          {t("garbage.weeklySchedule")}
        </h2>

        {schedule.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[#737373]">{t("garbage.noSchedule")}</p>
          </div>
        ) : (
          <div className="bg-white border border-[#e5e5e5]">
            {Array.from({ length: 7 }, (_, i) => i).map((dayIndex) => {
              const daySchedule = scheduleByDay.get(dayIndex);
              if (!daySchedule || daySchedule.length === 0) return null;

              return (
                <div
                  key={dayIndex}
                  className="flex items-start gap-4 px-4 py-3 border-b border-[#e5e5e5] last:border-b-0"
                >
                  <span
                    className={`text-sm font-medium w-8 flex-shrink-0 ${
                      dayIndex === 0
                        ? "text-red-400"
                        : dayIndex === 6
                          ? "text-blue-400"
                          : "text-[#1a1a1a]"
                    }`}
                  >
                    {dayNames[dayIndex]}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {daySchedule.map((entry) => (
                      <span
                        key={entry.id}
                        className="text-xs px-2.5 py-1 bg-[#f5f5f3] text-[#737373]"
                      >
                        {entry.garbage_type}
                        {entry.notes && (
                          <span className="text-[#a3a3a3] ml-1">
                            ({entry.notes})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 直近の当番 */}
      <section>
        <h2 className="text-xs text-[#a3a3a3] tracking-wide mb-3">
          {t("garbage.upcomingDuties")}
        </h2>

        {duties.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[#737373]">{t("garbage.noDuties")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {duties.map((duty, index) => {
              const isOwn = duty.user_id === currentUserId;
              const dutyDate = new Date(duty.duty_date + "T00:00:00");
              const dateStr = dutyDate.toLocaleDateString(
                locale === "ja" ? "ja-JP" : "en-US",
                {
                  month: "short",
                  day: "numeric",
                  weekday: "short",
                }
              );

              return (
                <m.div
                  key={duty.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                  className={`flex items-center gap-3 px-4 py-3 bg-white border ${
                    isOwn
                      ? "border-[#1a1a1a] bg-[#fafaf8]"
                      : "border-[#e5e5e5]"
                  } ${duty.is_completed ? "opacity-50" : ""}`}
                >
                  {/* 完了チェック（自分の当番のみ） */}
                  {isOwn && !duty.is_completed ? (
                    <button
                      type="button"
                      onClick={() => handleComplete(duty.id)}
                      disabled={completingId === duty.id}
                      className="w-5 h-5 border border-[#e5e5e5] hover:border-[#1a1a1a] flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50"
                      aria-label={t("garbage.markComplete")}
                    >
                      {completingId === duty.id && (
                        <span className="w-2 h-2 bg-[#a3a3a3] animate-pulse" />
                      )}
                    </button>
                  ) : (
                    <div
                      className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${
                        duty.is_completed
                          ? "bg-[#f5f5f3] border border-[#e5e5e5]"
                          : ""
                      }`}
                    >
                      {duty.is_completed && (
                        <span className="text-[10px] text-[#a3a3a3]">
                          ✓
                        </span>
                      )}
                    </div>
                  )}

                  {/* アバター */}
                  {duty.profile?.avatar_url ? (
                    <Image
                      src={duty.profile.avatar_url}
                      alt={duty.profile.name}
                      width={24}
                      height={24}
                      className="rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#f5f5f3] flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] text-[#a3a3a3]">
                        {duty.profile?.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}

                  {/* 情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-sm ${
                          isOwn
                            ? "text-[#1a1a1a] font-medium"
                            : "text-[#737373]"
                        }`}
                      >
                        {duty.profile?.name || t("garbage.unknownUser")}
                      </span>
                      {isOwn && (
                        <span className="text-[10px] text-[#a3a3a3]">
                          ({t("garbage.you")})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 日付・種類 */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-[#1a1a1a]">{dateStr}</p>
                    <p className="text-[10px] text-[#a3a3a3]">
                      {duty.garbage_type}
                    </p>
                  </div>
                </m.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
