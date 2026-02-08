"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { m, type Variants } from "framer-motion";
import { Camera } from "lucide-react";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RoomPhotoManager } from "@/components/room-photo-manager";
import {
  Profile,
  MBTI_LABELS,
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
  MBTI_GROUPS,
  getMBTIGroup,
} from "@/domain/profile";
import { MBTI_COLORS } from "@/lib/constants/mbti";
import type { RoomPhoto } from "@/domain/room-photo";
import { getInitials, calculateResidenceDuration } from "@/lib/utils";
import { TeaserOverlay } from "./public-teaser/teaser-overlay";
import { MaskedText } from "./public-teaser/masked-text";
import { uploadCoverPhoto } from "@/lib/profile/cover-photo-actions";
import { prepareImageForUpload } from "@/lib/utils/image-compression";
import { FILE_UPLOAD } from "@/lib/constants/config";
import type { Translator } from "@/lib/i18n";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import { logError } from "@/lib/errors";

function MBTIBadge({ mbti, className = "" }: { mbti: string; className?: string }) {
  const locale = useLocale();
  const group = getMBTIGroup(mbti);
  const colors = MBTI_COLORS[group];
  const labelEntry = MBTI_LABELS[mbti as keyof typeof MBTI_LABELS];
  const label = labelEntry ? labelEntry[locale === "ja" ? "ja" : "en"] : mbti;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:shadow-sm ${colors.bg} ${colors.text} ${colors.border} ${className}`}>
      <svg className={`w-3.5 h-3.5 ${colors.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
      <div className="flex items-baseline gap-1.5">
        <span className="font-bold tracking-wider text-[13px]">{mbti}</span>
        <span className="text-[10px] opacity-70 font-medium">
          {label}
        </span>
      </div>
    </span>
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

type CategoryType = "basic" | "work" | "lifestyle" | "communal" | "personality" | "photos";

const categoryConfig: Record<CategoryType, { color: string; bgColor: string; icon: React.ReactNode }> = {
  basic: {
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  work: {
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
  lifestyle: {
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ),
  },
  communal: {
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
  personality: {
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
  },
  photos: {
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    ),
  },
};

function ProfileSection({
  title,
  category,
  children,
  className = "",
}: {
  title: string;
  category: CategoryType;
  children: React.ReactNode;
  className?: string;
}) {
  const config = categoryConfig[category];
  return (
    <m.section variants={itemVariants} className={`premium-surface rounded-2xl overflow-hidden ${className}`}>
      <div className={`px-5 py-3 border-b border-border bg-muted/50`}>
        <h2 className={`flex items-center gap-2 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase ${config.color}`}>
          <span className="p-1 rounded-lg bg-card shadow-sm ring-1 ring-border">
            {config.icon}
          </span>
          {title}
        </h2>
      </div>
      <div className="p-5 sm:p-6">
        {children}
      </div>
    </m.section>
  );
}

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="py-3 border-b border-border last:border-0">
      <dt className="text-[10px] text-muted-foreground tracking-wide mb-1.5">{label}</dt>
      <dd className="text-sm text-foreground leading-relaxed">{value}</dd>
    </div>
  );
}

function CompactField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="space-y-1.5">
      <dt className="text-[10px] text-muted-foreground tracking-wide">{label}</dt>
      <dd className="text-sm text-foreground font-medium">{value}</dd>
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
  const locale = useLocale();
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(profile.cover_photo_url ?? null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
  const PHOTO_PREVIEW_LIMIT = 8;

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
    { label: t("profile.nickname"), value: profile.nickname },
    { label: t("profile.ageRange"), value: translateOption(profile.age_range, "ageRange", AGE_RANGES, t) },
    { label: t("profile.gender"), value: translateOption(profile.gender, "gender", GENDERS, t) },
    { label: t("profile.nationality"), value: profile.nationality },
    { label: t("profile.languages"), value: translateLanguages(profile.languages, t).join(", ") || null },
    { label: t("profile.hometown"), value: profile.hometown },
  ].filter((f) => f.value);

  const workInfo = [
    { label: t("profile.occupation"), value: translateOption(profile.occupation, "occupation", OCCUPATIONS, t) },
    { label: t("profile.industry"), value: translateOption(profile.industry, "industry", INDUSTRIES, t) },
    { label: t("profile.workLocation"), value: profile.work_location },
    { label: t("profile.workStyle"), value: translateOption(profile.work_style, "workStyle", WORK_STYLES, t) },
  ].filter((f) => f.value);

  const lifestyleInfo = [
    { label: t("profile.dailyRhythm"), value: translateOption(profile.daily_rhythm, "dailyRhythm", DAILY_RHYTHMS, t) },
    { label: t("profile.homeFrequency"), value: translateOption(profile.home_frequency, "homeFrequency", HOME_FREQUENCIES, t) },
    { label: t("profile.alcohol"), value: translateOption(profile.alcohol, "alcohol", ALCOHOL_OPTIONS, t) },
    { label: t("profile.smoking"), value: translateOption(profile.smoking, "smoking", SMOKING_OPTIONS, t) },
    { label: t("profile.pets"), value: translateOption(profile.pets, "pets", PET_OPTIONS, t) },
    { label: t("profile.guestFrequency"), value: translateOption(profile.guest_frequency, "guestFrequency", GUEST_FREQUENCIES, t) },
  ].filter((f) => f.value);

  const communalInfo = [
    { label: t("profile.socialStance"), value: translateOption(profile.social_stance, "socialStance", SOCIAL_STANCES, t) },
    { label: t("profile.cleaningAttitude"), value: translateOption(profile.cleaning_attitude, "cleaningAttitude", CLEANING_ATTITUDES, t) },
    { label: t("profile.cookingFrequency"), value: translateOption(profile.cooking_frequency, "cookingFrequency", COOKING_FREQUENCIES, t) },
    { label: t("profile.sharedMeals"), value: translateOption(profile.shared_meals, "sharedMeals", SHARED_MEAL_OPTIONS, t) },
    { label: t("profile.allergies"), value: profile.allergies },
  ].filter((f) => f.value);

  const sharedSpaceUsage = profile.shared_space_usage;
  const personalityInfo = [
    {
      label: t("profile.personalityType"),
      value: profile.personality_type,
      node: profile.mbti ? <MBTIBadge mbti={profile.mbti} className="mt-2" /> : null
    },
    { label: t("profile.weekendActivities"), value: profile.weekend_activities },
  ].filter((f) => f.value || f.node);

  const snsLinks = [
    { platform: "x", username: profile.sns_x, url: `https://x.com/${profile.sns_x}`, label: t("profile.snsX") },
    { platform: "instagram", username: profile.sns_instagram, url: `https://instagram.com/${profile.sns_instagram}`, label: t("profile.snsInstagram") },
    { platform: "facebook", username: profile.sns_facebook, url: `https://facebook.com/${profile.sns_facebook}`, label: t("profile.snsFacebook") },
    { platform: "linkedin", username: profile.sns_linkedin, url: `https://linkedin.com/in/${profile.sns_linkedin}`, label: t("profile.snsLinkedin") },
    { platform: "github", username: profile.sns_github, url: `https://github.com/${profile.sns_github}`, label: t("profile.snsGithub") },
  ].filter((link) => link.username);

  const hasExtendedInfo = basicInfo.length > 0 || workInfo.length > 0 || lifestyleInfo.length > 0 || communalInfo.length > 0 || personalityInfo.length > 0 || !!sharedSpaceUsage;

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
          className="mb-6 py-3 px-4 border border-dashed border-border bg-secondary rounded-lg"
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
        className={`premium-surface rounded-[2rem] overflow-hidden ${isMockProfile ? "border-dashed border-border" : ""}`}
      >
        {/* Cover Photo */}
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
            <div className="w-full h-full bg-linear-to-b from-slate-100 to-slate-200" />
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
              <Camera size={14} strokeWidth={1.5} />
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

        <div className="px-6 sm:px-10 pb-8">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
            <div className="shrink-0 -mt-14 sm:-mt-[84px] mx-auto sm:mx-0">
              <div className="w-28 h-28 sm:w-[168px] sm:h-[168px] rounded-full border-4 border-white bg-secondary overflow-hidden relative">
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

            <div className="flex-1 text-center sm:text-left sm:pt-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <h1 className="text-[28px] text-foreground tracking-wide font-light leading-tight">
                    {isTeaser ? (
                      <MaskedText text={profile.name} className="text-[28px]" />
                    ) : (
                      profile.name
                    )}
                  </h1>
                  {(profile.room_number || snsLinks.length > 0) && (
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 text-sm text-muted-foreground">
                      {profile.room_number && (
                        <span>{profile.room_number}{t("profile.room")}</span>
                      )}
                      {snsLinks.length > 0 && profile.room_number && (
                        <span className="text-muted-foreground/70">·</span>
                      )}
                      {snsLinks.map((link) => {
                        const icon = (
                          <>
                            {link.platform === "x" && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              </svg>
                            )}
                            {link.platform === "instagram" && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                              </svg>
                            )}
                            {link.platform === "facebook" && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                              </svg>
                            )}
                            {link.platform === "linkedin" && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                            )}
                            {link.platform === "github" && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                              </svg>
                            )}
                          </>
                        );

                        if (link.url) {
                          return (
                            <a
                              key={link.platform}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={`${link.label}: @${link.username}`}
                            >
                              {icon}
                            </a>
                          );
                        }

                        return (
                          <span
                            key={link.platform}
                            className="inline-flex items-center text-muted-foreground cursor-default"
                            title={`${link.label}: ${link.username}`}
                          >
                            {icon}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                {isOwnProfile && (
                  <Button variant="outline" size="sm" asChild className="self-center sm:self-start">
                    <Link href={`/profile/${profile.id}/edit`}>
                      {t("common.edit")}
                    </Link>
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                {profile.move_in_date && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-secondary text-muted-foreground">
                    <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    {calculateResidenceDuration(profile.move_in_date, t)}
                  </span>
                )}
                {profile.mbti && (
                  <MBTIBadge mbti={profile.mbti} />
                )}
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded ${teaTimeEnabled
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground"
                  }`}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                  </svg>
                  {t("teaTime.title")}: {teaTimeEnabled ? t("teaTime.participating") : t("teaTime.notParticipating")}
                </span>
              </div>

              {profile.bio && (
                <p className="text-sm text-foreground leading-relaxed">
                  {isTeaser ? "●".repeat(Math.min(profile.bio.length, 20)) : profile.bio}
                </p>
              )}
            </div>
          </div>

          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-10 pt-10 border-t border-border/80">
              <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                {t("profile.interests")}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="text-[13px] px-4 py-2 rounded-xl bg-muted text-foreground/80 font-medium border border-border/50 hover:bg-card hover:shadow-sm hover:border-primary/20 transition-all cursor-default"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(isOwnProfile || roomPhotos.length > 0) && (
            <div className="mt-10 pt-10 border-t border-border/80">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  {t("roomPhotos.roomPhotosSection")}
                  {isOwnProfile && (
                    <span className="text-muted-foreground/70 ml-1 font-medium">
                      {roomPhotos.length}/5
                    </span>
                  )}
                </p>
                <Link
                  href="/room-photos"
                  className="text-[10px] text-primary font-bold tracking-wider uppercase hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-full"
                >
                  {t("roomPhotos.viewGallery")}
                </Link>
              </div>

              {isOwnProfile ? (
                <RoomPhotoManager photos={roomPhotos} compact previewLimit={PHOTO_PREVIEW_LIMIT} />
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(isPhotoExpanded ? roomPhotos : roomPhotos.slice(0, PHOTO_PREVIEW_LIMIT)).map((photo) => (
                      <div key={photo.id} className="relative aspect-square bg-muted rounded-2xl overflow-hidden ring-1 ring-border group">
                        <Image
                          src={photo.photo_url}
                          alt={photo.caption || t("roomPhotos.roomPhotosSection")}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    ))}
                    {roomPhotos.length === 0 && (
                      <div className="col-span-full py-12 text-center bg-muted/50 rounded-[2rem] border-2 border-dashed border-border">
                        <p className="text-sm text-muted-foreground font-medium">{t("roomPhotos.noPhotos")}</p>
                      </div>
                    )}
                  </div>
                  {!isPhotoExpanded && roomPhotos.length > PHOTO_PREVIEW_LIMIT && (
                    <div className="flex justify-center mt-5">
                      <button
                        type="button"
                        onClick={() => setIsPhotoExpanded(true)}
                        className="h-9 px-6 rounded-full border border-border text-[11px] font-bold text-muted-foreground hover:text-foreground/90 hover:border-border tracking-wider uppercase transition-all duration-300"
                      >
                        {t("roomPhotos.showMore", { count: roomPhotos.length - PHOTO_PREVIEW_LIMIT })}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </m.div>

      {hasExtendedInfo && !isTeaser && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 relative">
          {basicInfo.length > 0 && (
            <ProfileSection title={t("profile.sectionBasicInfo")} category="basic">
              <dl className="grid grid-cols-2 gap-y-6 gap-x-4">
                {basicInfo.map((field, i) => (
                  <CompactField key={i} label={field.label} value={field.value} />
                ))}
              </dl>
            </ProfileSection>
          )}

          {workInfo.length > 0 && (
            <ProfileSection title={t("profile.sectionWork")} category="work">
              <dl className="grid grid-cols-2 gap-y-6 gap-x-4">
                {workInfo.map((field, i) => (
                  <CompactField key={i} label={field.label} value={field.value} />
                ))}
              </dl>
            </ProfileSection>
          )}

          {lifestyleInfo.length > 0 && (
            <ProfileSection title={t("profile.sectionLifestyle")} category="lifestyle">
              <dl className="grid grid-cols-2 gap-y-6 gap-x-4">
                {lifestyleInfo.map((field, i) => (
                  <CompactField key={i} label={field.label} value={field.value} />
                ))}
              </dl>
            </ProfileSection>
          )}

          {(communalInfo.length > 0 || sharedSpaceUsage) && (
            <ProfileSection title={t("profile.sectionCommunal")} category="communal">
              <dl className="space-y-6">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  {communalInfo.map((field, i) => (
                    <CompactField key={i} label={field.label} value={field.value} />
                  ))}
                </div>
                {sharedSpaceUsage && (
                  <div className="pt-4 border-t border-border/50">
                    <FieldRow label={t("profile.sharedSpaceUsage")} value={sharedSpaceUsage} />
                  </div>
                )}
              </dl>
            </ProfileSection>
          )}

          {personalityInfo.length > 0 && (
            <ProfileSection
              title={t("profile.sectionPersonality")}
              category="personality"
              className="sm:col-span-2 lg:col-span-3"
            >
              <dl className="grid sm:grid-cols-2 gap-x-12">
                {personalityInfo.map((field, i) => (
                  <div key={i} className="py-3 border-b border-border last:border-0">
                    <dt className="text-[10px] text-muted-foreground tracking-wide mb-1.5">{field.label}</dt>
                    <dd className="text-sm text-foreground leading-relaxed">
                      {("node" in field && field.node) ? (
                        <div className="flex flex-col gap-2">
                          {field.value && <span>{field.value}</span>}
                          {field.node}
                        </div>
                      ) : (
                        field.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </ProfileSection>
          )}
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
