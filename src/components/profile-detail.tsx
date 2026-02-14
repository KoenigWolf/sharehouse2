"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { m, type Variants } from "framer-motion";
import {
  Camera,
  MapPin,
  Briefcase,
  User,
  AlertTriangle,
  Wine,
  Cigarette,
  Home,
  Users,
  Sparkles,
  Globe,
  Clock,
  Utensils,
  Dog,
  Moon,
  Sun,
  Laptop,
  Building2,
  Brain,
  Palmtree,
  Pencil,
  Smile,
} from "lucide-react";
import { ICON_SIZE, ICON_STROKE, ICON_GAP } from "@/lib/constants/icons";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RoomPhotoManager } from "@/components/room-photo-manager";
import {
  Profile,
  AGE_RANGES,
  GENDERS,
  OCCUPATIONS,
  INDUSTRIES,
  WORK_STYLES,
  DAILY_RHYTHMS,
  HOME_FREQUENCIES,
  ALCOHOL_OPTIONS,
  SMOKING_OPTIONS,
  PET_OPTIONS,
  GUEST_FREQUENCIES,
  SOCIAL_STANCES,
  CLEANING_ATTITUDES,
  COOKING_FREQUENCIES,
  SHARED_MEAL_OPTIONS,
  LANGUAGES,
  getMBTIGroup,
} from "@/domain/profile";
import { MBTI_COLORS } from "@/lib/constants/mbti";
import type { RoomPhoto } from "@/domain/room-photo";
import { getInitials } from "@/lib/utils";
import { TeaserOverlay } from "./public-teaser/teaser-overlay";
import { MaskedText } from "./public-teaser/masked-text";
import { uploadCoverPhoto } from "@/lib/profile/cover-photo-actions";
import { prepareImageForUpload } from "@/lib/utils/image-compression";
import { FILE_UPLOAD } from "@/lib/constants/config";
import type { Translator } from "@/lib/i18n";
import { useI18n } from "@/hooks/use-i18n";
import { logError } from "@/lib/errors";

function MBTIBadge({ mbti, className = "" }: { mbti: string; className?: string }) {
  const t = useI18n();
  const group = getMBTIGroup(mbti);
  const colors = MBTI_COLORS[group];
  const label = t(`mbtiTypes.${mbti}.label` as Parameters<typeof t>[0]);

  return (
    <span className={`
      relative inline-flex items-center ${ICON_GAP.sm} px-3 py-1.5 rounded-xl border transition-all duration-300
      ${colors.bg} ${colors.text} ${colors.border}
      shadow-sm hover:shadow-md hover:scale-[1.02]
      overflow-hidden group
      ${className}
    `}>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]`} />

      <Sparkles size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.normal} className={colors.icon} />
      <div className={`flex items-baseline ${ICON_GAP.xs}`}>
        <span className="font-bold tracking-wider text-[13px] font-mono">{mbti}</span>
        <span className="text-[10px] opacity-80 font-medium tracking-wide">
          {label}
        </span>
      </div>
    </span>
  );
}

function MBTIDetail({ mbti }: { mbti: string }) {
  const t = useI18n();
  const group = getMBTIGroup(mbti);
  const colors = MBTI_COLORS[group];
  const label = t(`mbtiTypes.${mbti}.label` as Parameters<typeof t>[0]);
  const summary = t(`mbtiTypes.${mbti}.summary` as Parameters<typeof t>[0]);
  // TODO: Long-term fix is to store traits as an array in i18n files to avoid separator assumptions
  const traitsStr = t(`mbtiTypes.${mbti}.traits` as Parameters<typeof t>[0]);
  const traits = traitsStr.split(/\s*,\s*/);
  const groupLabel = t(`mbtiGroups.${group}` as Parameters<typeof t>[0]);

  // Extract first sentence for lead text (supports both Japanese "。" and ASCII ".")
  const jpPeriodIndex = summary.indexOf("。");
  const enPeriodIndex = summary.indexOf(".");
  const periodIndex = jpPeriodIndex !== -1 && enPeriodIndex !== -1
    ? Math.min(jpPeriodIndex, enPeriodIndex)
    : jpPeriodIndex !== -1 ? jpPeriodIndex : enPeriodIndex;
  const hasSplit = periodIndex !== -1;
  const leadText = hasSplit ? summary.substring(0, periodIndex + 1) : summary;
  const bodyText = hasSplit ? summary.substring(periodIndex + 1).trim() : "";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition-all hover:shadow-xl group">
      <div className={`relative px-6 py-8 sm:px-8 ${colors.hero} overflow-hidden`}>
        <div className="absolute -right-4 -bottom-8 text-[100px] font-black opacity-10 select-none pointer-events-none leading-none tracking-tighter transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-[-5deg] text-current">
          {mbti}
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-current opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3 text-current opacity-90">
            <span className="text-[10px] font-bold uppercase tracking-widest border border-current opacity-80 px-2 py-0.5 rounded-full">
              {groupLabel}
            </span>
            <span className="text-sm font-mono font-bold opacity-80 tracking-wider">
              {mbti}
            </span>
          </div>

          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-current mb-1">
            {label}
          </h3>
        </div>
      </div>

      <div className="p-6 sm:p-8 bg-card">
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <p className="text-lg sm:text-xl font-bold leading-relaxed text-foreground opacity-90">
              {leadText}
            </p>
            {bodyText && (
              <p className="text-sm leading-[1.8] text-muted-foreground whitespace-pre-line">
                {bodyText}
              </p>
            )}
          </div>

          <div className={`border-t w-full ${colors.border} opacity-50`} />

          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              {t("mbti.traitsLabel")}
            </span>
            <div className="flex flex-wrap gap-2">
              {traits.map((trait) => (
                <span
                  key={trait}
                  className={`
                    text-xs px-3 py-1.5 rounded-lg
                    ${colors.bg} ${colors.text} border ${colors.border}
                    font-medium tracking-wide
                    transition-all hover:scale-105 cursor-default
                  `}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProfileDetailProps {
  profile: Profile;
  isOwnProfile: boolean;
  isTeaser?: boolean;
  teaTimeEnabled?: boolean;
  roomPhotos?: RoomPhoto[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} as const;

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
};

function translateOption(
  value: string | null | undefined,
  category: string,
  options: readonly string[],
  t: Translator
): string | null {
  if (!value) return null;
  if (options.includes(value as typeof options[number])) {
    return t(`profileOptions.${category}.${value}` as Parameters<Translator>[0]);
  }
  return value;
}

function translateLanguages(
  languages: string[] | undefined,
  t: Translator
): string[] {
  if (!languages || languages.length === 0) return [];
  return languages.map((lang) => {
    if (LANGUAGES.includes(lang as typeof LANGUAGES[number])) {
      return t(`profileOptions.languages.${lang}` as Parameters<Translator>[0]);
    }
    return lang;
  });
}

function FbCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-xl border border-border shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function FbCardHeader({
  title,
  action
}: {
  title: string;
  action?: { label: string; href?: string; onClick?: () => void }
}) {
  return (
    <div className="flex items-center justify-between p-4 pb-2">
      <h3 className="text-[17px] font-bold text-foreground">{title}</h3>
      {action && (
        action.href ? (
          <Link href={action.href} className="text-sm text-primary hover:underline">
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className="text-sm text-primary hover:underline">
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

function DetailSection({
  title,
  icon,
  children
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <FbCard>
      <div className={`flex items-center ${ICON_GAP.lg} p-4 pb-3 border-b border-border`}>
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-[17px] font-bold text-foreground">{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </FbCard>
  );
}

function DetailItem({
  icon,
  label,
  value,
  suffix
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  suffix?: string;
}) {
  if (!value) return null;
  return (
    <div className={`flex items-center ${ICON_GAP.lg} py-2`} aria-label={label}>
      <span className="text-muted-foreground shrink-0" aria-hidden="true">{icon}</span>
      <span className="text-[15px] text-foreground">
        {value}{suffix && <span className="text-muted-foreground">{suffix}</span>}
      </span>
    </div>
  );
}

export function ProfileDetail({
  profile,
  isOwnProfile,
  isTeaser = false,
  teaTimeEnabled,
  roomPhotos = [],
}: ProfileDetailProps) {
  const isMockProfile = profile.id.startsWith("mock-");
  const t = useI18n();
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(profile.cover_photo_url ?? null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleCoverUploadClick = useCallback(() => {
    coverInputRef.current?.click();
  }, []);

  const handleCoverFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setFeedback(null);

    try {
      const prepared = await prepareImageForUpload(file);
      const formData = new FormData();
      formData.append("cover", prepared.file);
      const result = await uploadCoverPhoto(formData);

      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setCoverUrl(result.url);
        setFeedback({ type: "success", message: t("myPage.coverPhotoUpdated") });
        router.refresh();
      }
    } catch (error) {
      logError(error, { action: "handleCoverFileChange" });
      setFeedback({ type: "error", message: t("errors.compressionFailed") });
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  }, [t, router]);

  const basicInfo = [
    { label: t("profile.nickname"), value: profile.nickname, icon: <User size={ICON_SIZE.sm} />, suffix: t("profile.suffixNickname") },
    { label: t("profile.ageRange"), value: translateOption(profile.age_range, "ageRange", AGE_RANGES, t), icon: <Clock size={ICON_SIZE.sm} /> },
    { label: t("profile.gender"), value: translateOption(profile.gender, "gender", GENDERS, t), icon: <User size={ICON_SIZE.sm} /> },
    { label: t("profile.nationality"), value: profile.nationality, icon: <Globe size={ICON_SIZE.sm} /> },
    { label: t("profile.hometown"), value: profile.hometown, icon: <Home size={ICON_SIZE.sm} />, suffix: t("profile.suffixHometown") },
    { label: t("profile.languages"), value: translateLanguages(profile.languages, t).join(", ") || null, icon: <Globe size={ICON_SIZE.sm} /> },
  ].filter((f) => f.value);

  const workInfo = [
    { label: t("profile.occupation"), value: translateOption(profile.occupation, "occupation", OCCUPATIONS, t), icon: <Briefcase size={ICON_SIZE.sm} /> },
    { label: t("profile.industry"), value: translateOption(profile.industry, "industry", INDUSTRIES, t), icon: <Building2 size={ICON_SIZE.sm} />, suffix: t("profile.suffixIndustry") },
    { label: t("profile.workLocation"), value: profile.work_location, icon: <MapPin size={ICON_SIZE.sm} />, suffix: t("profile.suffixWorkLocation") },
    { label: t("profile.workStyle"), value: translateOption(profile.work_style, "workStyle", WORK_STYLES, t), icon: <Laptop size={ICON_SIZE.sm} /> },
  ].filter((f) => f.value);

  const lifestyleInfo = [
    { label: t("profile.dailyRhythm"), value: translateOption(profile.daily_rhythm, "dailyRhythm", DAILY_RHYTHMS, t), icon: profile.daily_rhythm === "morning" ? <Sun size={ICON_SIZE.sm} /> : <Moon size={ICON_SIZE.sm} /> },
    { label: t("profile.homeFrequency"), value: translateOption(profile.home_frequency, "homeFrequency", HOME_FREQUENCIES, t), icon: <Home size={ICON_SIZE.sm} /> },
    { label: t("profile.alcohol"), value: translateOption(profile.alcohol, "alcohol", ALCOHOL_OPTIONS, t), icon: <Wine size={ICON_SIZE.sm} /> },
    { label: t("profile.smoking"), value: translateOption(profile.smoking, "smoking", SMOKING_OPTIONS, t), icon: <Cigarette size={ICON_SIZE.sm} /> },
    { label: t("profile.pets"), value: translateOption(profile.pets, "pets", PET_OPTIONS, t), icon: <Dog size={ICON_SIZE.sm} /> },
    { label: t("profile.guestFrequency"), value: translateOption(profile.guest_frequency, "guestFrequency", GUEST_FREQUENCIES, t), icon: <Users size={ICON_SIZE.sm} /> },
  ].filter((f) => f.value);

  const communalInfo = [
    { label: t("profile.socialStance"), value: translateOption(profile.social_stance, "socialStance", SOCIAL_STANCES, t), icon: <Users size={ICON_SIZE.sm} /> },
    { label: t("profile.cleaningAttitude"), value: translateOption(profile.cleaning_attitude, "cleaningAttitude", CLEANING_ATTITUDES, t), icon: <Sparkles size={ICON_SIZE.sm} /> },
    { label: t("profile.cookingFrequency"), value: translateOption(profile.cooking_frequency, "cookingFrequency", COOKING_FREQUENCIES, t), icon: <Utensils size={ICON_SIZE.sm} /> },
    { label: t("profile.sharedMeals"), value: translateOption(profile.shared_meals, "sharedMeals", SHARED_MEAL_OPTIONS, t), icon: <Utensils size={ICON_SIZE.sm} /> },
    { label: t("profile.allergies"), value: profile.allergies ? `${profile.allergies}（${t("profile.allergies")}）` : null, icon: <AlertTriangle size={ICON_SIZE.sm} /> },
  ].filter((f) => f.value);

  const sharedSpaceUsage = profile.shared_space_usage;
  const personalityInfo = [
    { label: t("profile.personalityType"), value: profile.personality_type, icon: <Brain size={ICON_SIZE.sm} /> },
    { label: t("profile.weekendActivities"), value: profile.weekend_activities, icon: <Palmtree size={ICON_SIZE.sm} /> },
  ].filter((f) => f.value);

  const snsLinks = [
    { platform: "x", username: profile.sns_x, url: `https://x.com/${profile.sns_x}`, label: t("profile.snsX") },
    { platform: "instagram", username: profile.sns_instagram, url: `https://instagram.com/${profile.sns_instagram}`, label: t("profile.snsInstagram") },
    { platform: "facebook", username: profile.sns_facebook, url: `https://facebook.com/${profile.sns_facebook}`, label: t("profile.snsFacebook") },
    { platform: "linkedin", username: profile.sns_linkedin, url: `https://linkedin.com/in/${profile.sns_linkedin}`, label: t("profile.snsLinkedin") },
    { platform: "github", username: profile.sns_github, url: `https://github.com/${profile.sns_github}`, label: t("profile.snsGithub") },
  ].filter((link) => link.username);

  const hasExtendedInfo = basicInfo.length > 0 || workInfo.length > 0 || lifestyleInfo.length > 0 || communalInfo.length > 0 || personalityInfo.length > 0 || !!sharedSpaceUsage || !!profile.mbti;

  return (
    <m.article
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      {isMockProfile && (
        <m.div
          variants={itemVariants}
          className="mb-6 py-3 px-4 border border-dashed border-border bg-secondary rounded-xl"
          role="alert"
        >
          <p className="text-sm text-muted-foreground">{t("profile.mockProfileBanner")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("profile.mockProfileSubtext")}</p>
        </m.div>
      )}

      {isOwnProfile && (
        <input
          ref={coverInputRef}
          type="file"
          accept={FILE_UPLOAD.inputAccept}
          onChange={handleCoverFileChange}
          className="hidden"
          aria-label={t("myPage.coverPhoto")}
        />
      )}

      <m.div
        variants={itemVariants}
        className={`premium-surface rounded-2xl overflow-hidden ${isMockProfile ? "border-dashed border-border" : ""}`}
      >
        <div className="relative aspect-2/1 sm:aspect-21/8 bg-secondary overflow-hidden">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-muted/50 to-muted" />
          )}
          {isOwnProfile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCoverUploadClick}
              disabled={isUploadingCover}
              className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm border-border text-muted-foreground hover:text-foreground hover:border-border"
            >
              <Camera size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.thin} />
              {isUploadingCover
                ? t("myPage.coverPhotoUploading")
                : coverUrl
                  ? t("myPage.coverPhoto")
                  : t("myPage.noCoverPhoto")}
            </Button>
          )}
          {isOwnProfile && feedback && (
            <div
              className={`absolute top-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs px-3 py-2 text-xs border-l-2 ${feedback.type === "success"
                ? "bg-success-bg/95 border-success-border text-success"
                : "bg-error-bg/95 border-error-border text-error"
                } backdrop-blur-sm`}
            >
              {feedback.message}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-8 pb-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            <div className="shrink-0 -mt-[68px] sm:-mt-[84px]">
              <div className="w-[136px] h-[136px] sm:w-[168px] sm:h-[168px] rounded-full border-4 border-card bg-secondary overflow-hidden shadow-lg">
                <Avatar className="size-full rounded-full">
                  <OptimizedAvatarImage
                    src={profile.avatar_url}
                    alt={t("a11y.profilePhotoAlt", { name: isTeaser ? "●" : profile.name })}
                    context="detail"
                    priority
                    fallback={isTeaser ? "●" : getInitials(profile.name)}
                    fallbackClassName="bg-secondary text-muted-foreground text-4xl sm:text-5xl rounded-full w-full h-full"
                  />
                </Avatar>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left pb-2">
              <h1 className="text-[32px] font-bold text-foreground leading-tight">
                {isTeaser ? (
                  <MaskedText text={profile.name} className="text-[32px]" />
                ) : (
                  profile.name
                )}
              </h1>

              {snsLinks.length > 0 && (
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
                  {snsLinks.map((link) => (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`${link.label}: @${link.username}`}
                    >
                      {link.platform === "x" && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      )}
                      {link.platform === "instagram" && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      )}
                      {link.platform === "facebook" && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      )}
                      {link.platform === "linkedin" && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      )}
                      {link.platform === "github" && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                        </svg>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {isOwnProfile && (
              <div className="pb-2">
                <Button asChild className={ICON_GAP.md}>
                  <Link href={`/profile/${profile.id}/edit`}>
                    <Pencil size={ICON_SIZE.md} strokeWidth={ICON_STROKE.normal} />
                    {t("myPage.editProfile")}
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-border mt-4 pt-3">
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {profile.mbti && (
                <MBTIBadge mbti={profile.mbti} />
              )}
              <span className={`inline-flex items-center ${ICON_GAP.xs} text-[13px] px-3 py-1 rounded-full ${teaTimeEnabled
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
                }`}>
                <Smile size={ICON_SIZE.md} strokeWidth={ICON_STROKE.thin} />
                {t("teaTime.title")}: {teaTimeEnabled ? t("teaTime.participating") : t("teaTime.notParticipating")}
              </span>
            </div>

            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                {profile.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="text-[13px] px-3 py-1.5 rounded-full bg-muted text-foreground"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {personalityInfo.length > 0 && (
              <div className="border-t border-border mt-3 pt-3">
                <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-[14px] text-muted-foreground">
                  {personalityInfo.map((field, i) => (
                    <span key={i} className={`flex items-center ${ICON_GAP.xs}`} aria-label={field.label}>
                      <span aria-hidden="true">{field.icon}</span>
                      <span>{field.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </m.div>

      {hasExtendedInfo && !isTeaser && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 space-y-4">
            {basicInfo.length > 0 && (
              <m.div variants={itemVariants}>
                <DetailSection title={t("profile.sectionBasicInfo")} icon={<User size={ICON_SIZE.lg} />}>
                  {basicInfo.map((field, i) => (
                    <DetailItem key={i} icon={field.icon} label={field.label} value={field.value} suffix={field.suffix} />
                  ))}
                </DetailSection>
              </m.div>
            )}

            {workInfo.length > 0 && (
              <m.div variants={itemVariants}>
                <DetailSection title={t("profile.sectionWork")} icon={<Briefcase size={ICON_SIZE.lg} />}>
                  {workInfo.map((field, i) => (
                    <DetailItem key={i} icon={field.icon} label={field.label} value={field.value} suffix={field.suffix} />
                  ))}
                </DetailSection>
              </m.div>
            )}

            {lifestyleInfo.length > 0 && (
              <m.div variants={itemVariants}>
                <DetailSection title={t("profile.sectionLifestyle")} icon={<Sun size={ICON_SIZE.lg} />}>
                  {lifestyleInfo.map((field, i) => (
                    <DetailItem key={i} icon={field.icon} label={field.label} value={field.value} />
                  ))}
                </DetailSection>
              </m.div>
            )}

            {(communalInfo.length > 0 || sharedSpaceUsage) && (
              <m.div variants={itemVariants}>
                <DetailSection title={t("profile.sectionCommunal")} icon={<Users size={ICON_SIZE.lg} />}>
                  {communalInfo.map((field, i) => (
                    <DetailItem key={i} icon={field.icon} label={field.label} value={field.value} />
                  ))}
                  {sharedSpaceUsage && (
                    <div className="pt-3 mt-3 border-t border-border">
                      <div className="text-[15px] text-foreground">{sharedSpaceUsage}</div>
                      <div className="text-[13px] text-muted-foreground">{t("profile.sharedSpaceUsage")}</div>
                    </div>
                  )}
                </DetailSection>
              </m.div>
            )}

          </div>

          <div className="lg:col-span-2 space-y-4">
            {profile.mbti && (
              <m.div variants={itemVariants}>
                <MBTIDetail mbti={profile.mbti} />
              </m.div>
            )}

            {(isOwnProfile || roomPhotos.length > 0) && (
              <m.div variants={itemVariants}>
                <FbCard>
                  <FbCardHeader
                    title={t("roomPhotos.roomPhotosSection")}
                    action={{ label: t("roomPhotos.viewGallery"), href: "/room-photos" }}
                  />
                  <div className="px-4 pb-4">
                    {isOwnProfile ? (
                      <RoomPhotoManager photos={roomPhotos} compact previewLimit={6} />
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                          {roomPhotos.slice(0, 9).map((photo) => (
                            <div key={photo.id} className="relative aspect-square bg-muted">
                              <Image
                                src={photo.photo_url}
                                alt={photo.caption || ""}
                                fill
                                sizes="130px"
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                        {roomPhotos.length === 0 && (
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            {t("roomPhotos.noPhotos")}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </FbCard>
              </m.div>
            )}

          </div>
        </div>
      )}

      {isTeaser && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-6 sm:p-12 pb-[calc(24px+env(safe-area-inset-bottom))] flex justify-center pointer-events-none">
          <div className="pointer-events-auto w-full max-w-xl">
            <TeaserOverlay />
          </div>
        </div>
      )}
    </m.article>
  );
}
