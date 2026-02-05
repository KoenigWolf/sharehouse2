"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import { useI18n } from "@/hooks/use-i18n";
import { getFloorFromRoom, isNewResident, FLOOR_COLORS } from "@/lib/utils/residents";
import type { Profile } from "@/domain/profile";

interface ResidentStatsProps {
  profiles: Profile[];
  teaTimeParticipants: string[];
}

export function ResidentStats({ profiles, teaTimeParticipants }: ResidentStatsProps) {
  const t = useI18n();

  const stats = useMemo(() => {
    const registered = profiles.filter((p) => !p.id.startsWith("mock-"));
    const newResidents = registered.filter((p) => isNewResident(p.move_in_date));
    const teaTimeCount = registered.filter((p) => teaTimeParticipants.includes(p.id)).length;

    const floorStats: Record<string, { total: number; registered: number }> = {
      "2F": { total: 5, registered: 0 },
      "3F": { total: 5, registered: 0 },
      "4F": { total: 5, registered: 0 },
      "5F": { total: 5, registered: 0 },
    };

    registered.forEach((p) => {
      const floor = getFloorFromRoom(p.room_number);
      if (floorStats[floor]) {
        floorStats[floor].registered++;
      }
    });

    return {
      total: 20,
      registered: registered.length,
      unregistered: 20 - registered.length,
      newResidents: newResidents.length,
      teaTimeCount,
      floorStats,
    };
  }, [profiles, teaTimeParticipants]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label={t("residents.statsRegistered")}
          value={stats.registered}
          subValue={`/ ${stats.total}`}
          color="var(--foreground)"
        />
        <StatCard
          label={t("residents.statsNew")}
          value={stats.newResidents}
          subValue={t("residents.statsNewSub")}
          color="var(--brand-500)"
        />
        <StatCard
          label={t("residents.statsTeaTime")}
          value={stats.teaTimeCount}
          subValue={t("residents.statsParticipants")}
          color="#8b5cf6"
        />
        <StatCard
          label={t("residents.statsUnregistered")}
          value={stats.unregistered}
          subValue={t("residents.statsRooms")}
          color="var(--muted-foreground)"
        />
      </div>

      <div className="premium-surface rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-4">
            {t("residents.floorOccupancy")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {(["5F", "4F", "3F", "2F"] as const).map((floor) => {
              const floorStat = stats.floorStats[floor];
              const percentage = (floorStat.registered / floorStat.total) * 100;
              const colors = FLOOR_COLORS[floor];
              return (
                <div key={floor} className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-bold tracking-tight ${colors.text}`}>{floor}</span>
                    <span className="text-xs font-semibold text-slate-400">
                      {floorStat.registered} <span className="opacity-50">/</span> {floorStat.total}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100/50 shadow-inner">
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: "circOut", delay: 0.2 }}
                      style={{ backgroundColor: colors.fill }}
                      className="h-full rounded-full shadow-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subValue,
  color,
}: {
  label: string;
  value: number;
  subValue: string;
  color: string;
}) {
  return (
    <div className="premium-surface rounded-2xl p-5 sm:p-6 transition-all hover:shadow-xl hover:-translate-y-0.5 border-slate-50">
      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1.5">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <p className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color }}>
          {value}
        </p>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">
          {subValue}
        </p>
      </div>
    </div>
  );
}
