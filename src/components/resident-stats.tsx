"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import { useI18n } from "@/hooks/use-i18n";
import { getFloorFromRoom, isNewResident, FLOOR_COLORS } from "@/lib/utils/residents";
import type { Profile } from "@/domain/profile";
import {
  UsersIcon,
  BriefcaseIcon,
  CoffeeIcon,
  HeartHandshakeIcon,
  MapPinIcon,
  ClockIcon,
  ActivityIcon,
} from "lucide-react";

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

    // Helper to count occurrences of a field
    const countBy = (field: keyof Profile, translationPrefix?: string) => {
      const counts: Record<string, number> = {};
      registered.forEach((p) => {
        const val = p[field] as string;
        if (val) {
          // Use translation if prefix is provided, otherwise usage value itself
          // We cast to any because dynamically constructed keys can't be easily typed
          const key = translationPrefix ? `${translationPrefix}.${val}` : val;
          const translated = translationPrefix ? t(key as any) : val;
          // If translation returns the key itself (fallback), use the original value
          const label = translated === key ? val : translated;

          counts[label] = (counts[label] || 0) + 1;
        }
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label, count, percentage: (count / registered.length) * 100 }));
    };

    // Calculate Last Active Stats
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const activityCounts: Record<string, number> = {
      within24h: 0,
      within3d: 0,
      within1w: 0,
      within1m: 0,
      moreThan1m: 0,
    };

    registered.forEach((p) => {
      const profileUpdate = new Date(p.updated_at).getTime();
      const vibeUpdate = p.vibe?.updated_at ? new Date(p.vibe.updated_at).getTime() : 0;
      const lastActive = Math.max(profileUpdate, vibeUpdate);
      const diff = now.getTime() - lastActive;

      if (diff < oneDay) activityCounts.within24h++;
      else if (diff < oneDay * 3) activityCounts.within3d++;
      else if (diff < oneDay * 7) activityCounts.within1w++;
      else if (diff < oneDay * 30) activityCounts.within1m++;
      else activityCounts.moreThan1m++;
    });

    const activityStats = [
      { label: t("residents.activityRanges.within24h"), count: activityCounts.within24h, percentage: (activityCounts.within24h / registered.length) * 100 },
      { label: t("residents.activityRanges.within3d"), count: activityCounts.within3d, percentage: (activityCounts.within3d / registered.length) * 100 },
      { label: t("residents.activityRanges.within1w"), count: activityCounts.within1w, percentage: (activityCounts.within1w / registered.length) * 100 },
      { label: t("residents.activityRanges.within1m"), count: activityCounts.within1m, percentage: (activityCounts.within1m / registered.length) * 100 },
      { label: t("residents.activityRanges.moreThan1m"), count: activityCounts.moreThan1m, percentage: (activityCounts.moreThan1m / registered.length) * 100 },
    ].filter(i => i.count > 0);

    // Calculate Floor Stats
    const floorStats: Record<string, { total: number; registered: number }> = {
      "2F": { total: 5, registered: 0 },
      "3F": { total: 5, registered: 0 },
      "4F": { total: 5, registered: 0 },
      "5F": { total: 5, registered: 0 },
    };
    registered.forEach((p) => {
      const floor = getFloorFromRoom(p.room_number);
      if (floorStats[floor]) floorStats[floor].registered++;
    });

    return {
      total: 20,
      registered: registered.length,
      unregistered: 20 - registered.length,
      newResidents: newResidents.length,
      teaTimeCount,
      floorStats,
      activity: activityStats,
      demographics: {
        age: countBy("age_range", "profileOptions.ageRange"),
        gender: countBy("gender", "profileOptions.gender"),
        nationality: countBy("nationality"),
        hometown: countBy("hometown"),
      },
      work: {
        occupation: countBy("occupation", "profileOptions.occupation"),
        industry: countBy("industry", "profileOptions.industry"),
        workStyle: countBy("work_style", "profileOptions.workStyle"),
        workLocation: countBy("work_location"),
      },
      lifestyle: {
        rhythm: countBy("daily_rhythm", "profileOptions.dailyRhythm"),
        homeFreq: countBy("home_frequency", "profileOptions.homeFrequency"),
        alcohol: countBy("alcohol", "profileOptions.alcohol"),
        smoking: countBy("smoking", "profileOptions.smoking"),
      },
      community: {
        social: countBy("social_stance", "profileOptions.socialStance"),
        cleaning: countBy("cleaning_attitude", "profileOptions.cleaningAttitude"),
        cooking: countBy("cooking_frequency", "profileOptions.cookingFrequency"),
        sharedMeals: countBy("shared_meals", "profileOptions.sharedMeals"),
        guestFreq: countBy("guest_frequency", "profileOptions.guestFrequency"),
      }
    };
  }, [profiles, teaTimeParticipants, t]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label={t("residents.statsRegistered")} value={stats.registered} subValue={`/ ${stats.total}`} color="var(--foreground)" />
        <StatCard label={t("residents.statsNew")} value={stats.newResidents} subValue={t("residents.statsNewSub")} color="var(--brand-500)" />
        <StatCard label={t("residents.statsTeaTime")} value={stats.teaTimeCount} subValue={t("residents.statsParticipants")} color="var(--floor-violet)" />
        <StatCard label={t("residents.statsUnregistered")} value={stats.unregistered} subValue={t("residents.statsRooms")} color="var(--muted-foreground)" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Floor Occupancy (Visual Bar) */}
        <Section title={t("residents.floorOccupancy")} icon={<MapPinIcon size={18} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(["5F", "4F", "3F", "2F"] as const).map((floor) => {
              const floorStat = stats.floorStats[floor];
              const percentage = (floorStat.registered / floorStat.total) * 100;
              const colors = FLOOR_COLORS[floor];
              return (
                <div key={floor} className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-bold tracking-tight ${colors.text}`}>{floor}</span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {floorStat.registered} <span className="opacity-50">/</span> {floorStat.total}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden p-0.5 border border-border/50 shadow-inner">
                    <m.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${percentage}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                      style={{ backgroundColor: colors.fill }}
                      className="h-full rounded-full shadow-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* 2. Activity (New!) */}
        <Section title={t("residents.statsActivity")} icon={<ActivityIcon size={18} />}>
          <ChartGroup title={t("residents.statsActivity")} data={stats.activity} />
        </Section>
      </div>

      {/* 2. Demographics */}
      <Section title={t("profile.sectionBasicInfo")} icon={<UsersIcon size={18} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ChartGroup title={t("profile.ageRange")} data={stats.demographics.age} />
          <ChartGroup title={t("profile.gender")} data={stats.demographics.gender} />
          <ChartGroup title={t("profile.nationality")} data={stats.demographics.nationality} type="list" />
          <ChartGroup title={t("profile.hometown")} data={stats.demographics.hometown} type="list" />
        </div>
      </Section>

      {/* 3. Work & Career */}
      <Section title={t("profile.sectionWork")} icon={<BriefcaseIcon size={18} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ChartGroup title={t("profile.occupation")} data={stats.work.occupation} />
          <ChartGroup title={t("profile.industry")} data={stats.work.industry} />
          <ChartGroup title={t("profile.workStyle")} data={stats.work.workStyle} />
          <ChartGroup title={t("profile.workLocation")} data={stats.work.workLocation} type="list" />
        </div>
      </Section>

      {/* 4. Lifestyle */}
      <Section title={t("profile.sectionLifestyle")} icon={<ClockIcon size={18} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ChartGroup title={t("profile.dailyRhythm")} data={stats.lifestyle.rhythm} />
          <ChartGroup title={t("profile.homeFrequency")} data={stats.lifestyle.homeFreq} />
          <ChartGroup title={t("profile.alcohol")} data={stats.lifestyle.alcohol} />
          <ChartGroup title={t("profile.smoking")} data={stats.lifestyle.smoking} />
        </div>
      </Section>

      {/* 5. Community */}
      <Section title={t("profile.sectionCommunal")} icon={<HeartHandshakeIcon size={18} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ChartGroup title={t("profile.socialStance")} data={stats.community.social} />
          <ChartGroup title={t("profile.cleaningAttitude")} data={stats.community.cleaning} />
          <ChartGroup title={t("profile.cookingFrequency")} data={stats.community.cooking} />
          <ChartGroup title={t("profile.sharedMeals")} data={stats.community.sharedMeals} />
          <ChartGroup title={t("profile.guestFrequency")} data={stats.community.guestFreq} />
        </div>
      </Section>
    </div>
  );
}

// --- Subcomponents ---

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="premium-surface rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
        <div className="p-2 rounded-lg bg-muted text-foreground">{icon}</div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, subValue, color }: { label: string; value: number; subValue: string; color: string }) {
  return (
    <div className="premium-surface rounded-2xl p-5 sm:p-6 transition-all hover:shadow-xl hover:-translate-y-0.5 border-border/50">
      <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1.5">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color }}>{value}</p>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">{subValue}</p>
      </div>
    </div>
  );
}

function ChartGroup({ title, data, type = "bar" }: { title: string; data: { label: string; count: number; percentage: number }[]; type?: "bar" | "list" }) {
  if (data.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</h3>
      <div className="space-y-3">
        {data.slice(0, 5).map((item, index) => (
          <div key={item.label} className="group">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-medium text-foreground truncate max-w-[70%]">{item.label}</span>
              <span className="font-semibold text-muted-foreground text-xs tabular-nums">
                {item.count} <span className="text-[10px] opacity-70">({Math.round(item.percentage)}%)</span>
              </span>
            </div>
            {type === "bar" && (
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <m.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full bg-foreground/80 rounded-full group-hover:bg-brand-500 transition-colors"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
