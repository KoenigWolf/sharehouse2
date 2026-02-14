"use client";

import { useMemo } from "react";
import { m, type Variants } from "framer-motion";
import { useI18n } from "@/hooks/use-i18n";
import { getFloorFromRoom, isNewResident, FLOOR_COLORS } from "@/lib/utils/residents";
import type { Profile } from "@/domain/profile";
import {
  UsersIcon,
  BriefcaseIcon,
  HeartHandshakeIcon,
  MapPinIcon,
  ClockIcon,
  ActivityIcon,
  BrainIcon,
  GlobeIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  CalendarIcon,
  ImageIcon,
  MessageSquareIcon,
  CoffeeIcon,
  TrashIcon,
  SparklesIcon,
} from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

interface ExtendedStats {
  events: {
    total: number;
    upcoming: number;
    past: number;
    totalAttendees: number;
    uniqueCreators: number;
    avgAttendeesPerEvent: number;
  };
  shareItems: {
    total: number;
    available: number;
    claimed: number;
    expired: number;
    uniqueSharers: number;
  };
  roomPhotos: {
    total: number;
    uniqueUploaders: number;
    photosPerUser: number;
  };
  teaTimeMatches: {
    total: number;
    done: number;
    skipped: number;
    successRate: number;
  };
  garbageDuties: {
    total: number;
    completed: number;
    upcoming: number;
    completionRate: number;
  };
  bulletins: {
    total: number;
    uniquePosters: number;
  };
}

interface ResidentStatsProps {
  profiles: Profile[];
  teaTimeParticipants: string[];
  extendedStats: ExtendedStats;
}

export function ResidentStats({ profiles, teaTimeParticipants, extendedStats }: ResidentStatsProps) {
  const t = useI18n();

  const stats = useMemo(() => {
    const registered = profiles.filter((p) => !p.id.startsWith("mock-"));
    const newResidents = registered.filter((p) => isNewResident(p.move_in_date));
    const teaTimeCount = registered.filter((p) => teaTimeParticipants.includes(p.id)).length;

    const countBy = (field: keyof Profile, translationPrefix?: string) => {
      const counts: Record<string, number> = {};
      registered.forEach((p) => {
        const val = p[field] as string;
        if (val) {
          const key = translationPrefix ? `${translationPrefix}.${val}` : val;
          const translated = translationPrefix ? t(key as Parameters<typeof t>[0]) : val;
          const label = translated === key ? val : translated;
          counts[label] = (counts[label] || 0) + 1;
        }
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label, count, percentage: (count / registered.length) * 100 }));
    };

    const countArrayField = (field: keyof Profile) => {
      const counts: Record<string, number> = {};
      registered.forEach((p) => {
        const arr = p[field] as string[] | null;
        if (arr && Array.isArray(arr)) {
          arr.forEach((item) => {
            if (item) {
              counts[item] = (counts[item] || 0) + 1;
            }
          });
        }
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label, count, percentage: (count / registered.length) * 100 }));
    };

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

    const completionFields = ["name", "room_number", "bio", "avatar_url", "interests", "age_range", "occupation", "daily_rhythm", "social_stance"] as const;
    const completionScores = registered.map((p) => {
      const filled = completionFields.filter((f) => {
        const val = p[f];
        if (Array.isArray(val)) return val.length > 0;
        return !!val;
      }).length;
      return Math.round((filled / completionFields.length) * 100);
    });
    const avgCompletion = completionScores.length > 0 ? Math.round(completionScores.reduce((a, b) => a + b, 0) / completionScores.length) : 0;
    const completionDistribution = [
      { label: "90-100%", count: completionScores.filter((s) => s >= 90).length, percentage: 0 },
      { label: "70-89%", count: completionScores.filter((s) => s >= 70 && s < 90).length, percentage: 0 },
      { label: "50-69%", count: completionScores.filter((s) => s >= 50 && s < 70).length, percentage: 0 },
      { label: "0-49%", count: completionScores.filter((s) => s < 50).length, percentage: 0 },
    ].map((item) => ({ ...item, percentage: registered.length > 0 ? (item.count / registered.length) * 100 : 0 })).filter((i) => i.count > 0);

    const snsFields = ["sns_x", "sns_instagram", "sns_facebook", "sns_linkedin", "sns_github"] as const;
    const snsUsage = snsFields.map((field) => {
      const count = registered.filter((p) => p[field]).length;
      const labelMap: Record<string, string> = {
        sns_x: "X (Twitter)",
        sns_instagram: "Instagram",
        sns_facebook: "Facebook",
        sns_linkedin: "LinkedIn",
        sns_github: "GitHub",
      };
      return { label: labelMap[field], count, percentage: registered.length > 0 ? (count / registered.length) * 100 : 0 };
    }).filter((i) => i.count > 0).sort((a, b) => b.count - a.count);

    const themeUsage = countBy("theme_style");
    const colorModeUsage = countBy("color_mode");

    const moveInByYear: Record<string, number> = {};
    registered.forEach((p) => {
      if (p.move_in_date) {
        const year = new Date(p.move_in_date).getFullYear().toString();
        moveInByYear[year] = (moveInByYear[year] || 0) + 1;
      }
    });
    const moveInYearStats = Object.entries(moveInByYear)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([label, count]) => ({ label, count, percentage: (count / registered.length) * 100 }));

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
        pets: countBy("pets", "profileOptions.pets"),
      },
      community: {
        social: countBy("social_stance", "profileOptions.socialStance"),
        cleaning: countBy("cleaning_attitude", "profileOptions.cleaningAttitude"),
        cooking: countBy("cooking_frequency", "profileOptions.cookingFrequency"),
        sharedMeals: countBy("shared_meals", "profileOptions.sharedMeals"),
        guestFreq: countBy("guest_frequency", "profileOptions.guestFrequency"),
      },
      personality: {
        mbti: countBy("mbti"),
        languages: countArrayField("languages"),
        interests: countArrayField("interests"),
      },
      profile: {
        avgCompletion,
        completionDistribution,
        snsUsage,
        themeUsage,
        colorModeUsage,
        moveInYearStats,
      },
    };
  }, [profiles, teaTimeParticipants, t]);

  const occupancyRate = Math.round((stats.registered / stats.total) * 100);

  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* HERO SECTION */}
      <m.div variants={itemVariants} className="premium-surface rounded-2xl p-5 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              {t("stats.registered")}
            </p>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-none">
                {stats.registered}
              </span>
              <span className="text-xl sm:text-2xl text-muted-foreground/50 font-light">/{stats.total}</span>
            </div>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <m.div
                initial={{ width: 0 }}
                animate={{ width: `${occupancyRate}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="h-full bg-brand-500 rounded-full"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2 tabular-nums">{occupancyRate}%</p>
          </div>

          <HeroMetric value={stats.newResidents} label={t("stats.newResidents")} sub={t("stats.within3Months")} accent="brand" />
          <HeroMetric value={stats.teaTimeCount} label={t("stats.teaTime")} sub={t("stats.participating")} accent="violet" />
          <HeroMetric value={stats.profile.avgCompletion} label={t("stats.avgCompletion")} sub="%" accent="teal" suffix="%" />
        </div>
      </m.div>

      {/* CONTENT METRICS */}
      <m.div variants={itemVariants} className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
        <QuickStat icon={<CalendarIcon size={16} />} value={extendedStats.events.total} label={t("stats.totalEvents")} detail={`${extendedStats.events.upcoming} ${t("stats.upcoming")}`} />
        <QuickStat icon={<SparklesIcon size={16} />} value={extendedStats.shareItems.total} label={t("stats.shareItems")} detail={`${extendedStats.shareItems.available} ${t("stats.available")}`} />
        <QuickStat icon={<ImageIcon size={16} />} value={extendedStats.roomPhotos.total} label={t("stats.photos")} detail={`${extendedStats.roomPhotos.uniqueUploaders}人`} />
        <QuickStat icon={<MessageSquareIcon size={16} />} value={extendedStats.bulletins.total} label={t("stats.vibes")} detail={`${extendedStats.bulletins.uniquePosters}人`} />
        <QuickStat icon={<CoffeeIcon size={16} />} value={extendedStats.teaTimeMatches.total} label={t("stats.teaTimeMatches")} detail={`${extendedStats.teaTimeMatches.successRate}%`} />
        <QuickStat icon={<TrashIcon size={16} />} value={extendedStats.garbageDuties.completed} label={t("stats.completed")} detail={`${extendedStats.garbageDuties.completionRate}%`} />
      </m.div>

      {/* OCCUPANCY & ENGAGEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <m.div variants={itemVariants} className="lg:col-span-2">
          <Card title={t("residents.floorOccupancy")} icon={<MapPinIcon size={16} />}>
            <div className="space-y-4">
              {(["5F", "4F", "3F", "2F"] as const).map((floor, i) => {
                const floorStat = stats.floorStats[floor];
                const percentage = (floorStat.registered / floorStat.total) * 100;
                const colors = FLOOR_COLORS[floor];
                return (
                  <div key={floor}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-bold ${colors.text}`}>{floor}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {floorStat.registered}<span className="opacity-50">/{floorStat.total}</span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden">
                      <m.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${percentage}%` }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                        style={{ backgroundColor: colors.fill }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </m.div>

        <m.div variants={itemVariants} className="lg:col-span-3">
          <Card title={t("stats.engagementMetrics")} icon={<TrendingUpIcon size={16} />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Tile value={extendedStats.events.avgAttendeesPerEvent} unit={t("stats.perEvent")} label={t("stats.avgAttendees")} />
              <Tile value={extendedStats.events.uniqueCreators} unit={t("stats.people")} label={t("stats.eventCreators")} />
              <Tile value={extendedStats.shareItems.uniqueSharers} unit={t("stats.people")} label={t("stats.sharers")} />
              <Tile value={extendedStats.roomPhotos.photosPerUser} unit={t("stats.avg")} label={t("stats.photosPerUser")} />
              <Tile value={extendedStats.shareItems.claimed} unit={t("stats.items")} label={t("stats.claimedItems")} />
              <Tile value={extendedStats.garbageDuties.upcoming} unit={t("stats.duties")} label={t("stats.upcomingDuties")} />
            </div>
          </Card>
        </m.div>
      </div>

      {/* ACTIVITY & PROFILE QUALITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <m.div variants={itemVariants}>
          <Card title={t("residents.statsActivity")} icon={<ActivityIcon size={16} />}>
            <BarList data={stats.activity} />
          </Card>
        </m.div>

        <m.div variants={itemVariants}>
          <Card title={t("stats.profileQuality")} icon={<CheckCircleIcon size={16} />}>
            <div className="grid grid-cols-2 gap-6">
              <BarList title={t("stats.completionDist")} data={stats.profile.completionDistribution} />
              <BarList title={t("stats.moveInYear")} data={stats.profile.moveInYearStats} />
            </div>
          </Card>
        </m.div>
      </div>

      {/* PERSONALITY & PLATFORM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <m.div variants={itemVariants}>
          <Card title={t("stats.personalityInterests")} icon={<BrainIcon size={16} />}>
            <div className="grid grid-cols-3 gap-5">
              <BarList title="MBTI" data={stats.personality.mbti} compact />
              <BarList title={t("profile.languages")} data={stats.personality.languages} compact />
              <BarList title={t("profile.interests")} data={stats.personality.interests} compact />
            </div>
          </Card>
        </m.div>

        <m.div variants={itemVariants}>
          <Card title={t("stats.platformUsage")} icon={<GlobeIcon size={16} />}>
            <div className="grid grid-cols-3 gap-5">
              <BarList title={t("stats.snsUsage")} data={stats.profile.snsUsage} compact />
              <BarList title={t("stats.themeStyle")} data={stats.profile.themeUsage} compact />
              <BarList title={t("stats.colorMode")} data={stats.profile.colorModeUsage} compact />
            </div>
          </Card>
        </m.div>
      </div>

      {/* DEMOGRAPHICS */}
      <m.div variants={itemVariants}>
        <Card title={t("profile.sectionBasicInfo")} icon={<UsersIcon size={16} />}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <BarList title={t("profile.ageRange")} data={stats.demographics.age} />
            <BarList title={t("profile.gender")} data={stats.demographics.gender} />
            <BarList title={t("profile.nationality")} data={stats.demographics.nationality} />
            <BarList title={t("profile.hometown")} data={stats.demographics.hometown} />
          </div>
        </Card>
      </m.div>

      {/* WORK & LIFESTYLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <m.div variants={itemVariants}>
          <Card title={t("profile.sectionWork")} icon={<BriefcaseIcon size={16} />}>
            <div className="grid grid-cols-2 gap-6">
              <BarList title={t("profile.occupation")} data={stats.work.occupation} />
              <BarList title={t("profile.industry")} data={stats.work.industry} />
              <BarList title={t("profile.workStyle")} data={stats.work.workStyle} />
              <BarList title={t("profile.workLocation")} data={stats.work.workLocation} />
            </div>
          </Card>
        </m.div>

        <m.div variants={itemVariants}>
          <Card title={t("profile.sectionLifestyle")} icon={<ClockIcon size={16} />}>
            <div className="grid grid-cols-2 gap-6">
              <BarList title={t("profile.dailyRhythm")} data={stats.lifestyle.rhythm} />
              <BarList title={t("profile.homeFrequency")} data={stats.lifestyle.homeFreq} />
              <BarList title={t("profile.alcohol")} data={stats.lifestyle.alcohol} />
              <BarList title={t("profile.smoking")} data={stats.lifestyle.smoking} />
            </div>
          </Card>
        </m.div>
      </div>

      {/* COMMUNITY */}
      <m.div variants={itemVariants}>
        <Card title={t("profile.sectionCommunal")} icon={<HeartHandshakeIcon size={16} />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            <BarList title={t("profile.socialStance")} data={stats.community.social} />
            <BarList title={t("profile.cleaningAttitude")} data={stats.community.cleaning} />
            <BarList title={t("profile.cookingFrequency")} data={stats.community.cooking} />
            <BarList title={t("profile.sharedMeals")} data={stats.community.sharedMeals} />
            <BarList title={t("profile.guestFrequency")} data={stats.community.guestFreq} />
          </div>
        </Card>
      </m.div>
    </m.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

function HeroMetric({
  value,
  label,
  sub,
  accent,
  suffix,
}: {
  value: number;
  label: string;
  sub: string;
  accent: "brand" | "violet" | "teal";
  suffix?: string;
}) {
  const colorMap = {
    brand: "text-brand-500",
    violet: "text-floor-violet",
    teal: "text-floor-teal",
  };

  return (
    <div className="flex flex-col justify-center min-w-0">
      <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-0.5 mt-1.5">
        <span className={`text-3xl sm:text-4xl font-bold tracking-tight leading-none ${colorMap[accent]}`}>
          {value}
        </span>
        {suffix && <span className="text-lg font-medium text-muted-foreground/60">{suffix}</span>}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function QuickStat({
  icon,
  value,
  label,
  detail,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  detail: string;
}) {
  return (
    <div className="premium-surface rounded-xl p-3 sm:p-4 text-center group hover:shadow-md transition-all duration-200">
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-muted/60 text-muted-foreground mb-2 group-hover:bg-brand-500/10 group-hover:text-brand-500 transition-colors">
        {icon}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums leading-tight">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground mt-1 line-clamp-1">{label}</p>
      <p className="text-xs text-muted-foreground/60">{detail}</p>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="premium-surface rounded-2xl p-5 sm:p-6 h-full">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-1.5 rounded-lg bg-muted/70 text-muted-foreground">{icon}</div>
        <h2 className="text-sm font-bold tracking-wide text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Tile({
  value,
  unit,
  label,
}: {
  value: number;
  unit: string;
  label: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-muted/40 text-center hover:bg-muted/60 transition-colors">
      <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground mt-0.5">{unit}</p>
      <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{label}</p>
    </div>
  );
}

function BarList({
  title,
  data,
  compact = false,
}: {
  title?: string;
  data: { label: string; count: number; percentage: number }[];
  compact?: boolean;
}) {
  if (data.length === 0) return null;

  const maxItems = compact ? 4 : 5;

  return (
    <div className="min-w-0">
      {title && (
        <h3 className="text-xs font-semibold text-muted-foreground mb-3">
          {title}
        </h3>
      )}
      <div className="space-y-3">
        {data.slice(0, maxItems).map((item, i) => (
          <div key={item.label} className="group">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-foreground truncate">{item.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {item.count}
                <span className="opacity-50 ml-1">({Math.round(item.percentage)}%)</span>
              </span>
            </div>
            <div className="h-1.5 bg-muted/70 rounded-full overflow-hidden">
              <m.div
                initial={{ width: 0 }}
                whileInView={{ width: `${item.percentage}%` }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
                className="h-full bg-foreground/60 rounded-full group-hover:bg-brand-500 transition-colors duration-200"
              />
            </div>
          </div>
        ))}
        {data.length > maxItems && (
          <p className="text-xs text-muted-foreground/60 pt-1">+{data.length - maxItems}</p>
        )}
      </div>
    </div>
  );
}
