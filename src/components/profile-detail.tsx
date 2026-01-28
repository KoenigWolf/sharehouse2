"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
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
  OVERNIGHT_OPTIONS,
  SOCIAL_STANCES,
  CLEANING_ATTITUDES,
  COOKING_FREQUENCIES,
  SHARED_MEAL_OPTIONS,
  LANGUAGES,
} from "@/domain/profile";
import type { RoomPhoto } from "@/domain/room-photo";
import { getInitials, formatDate, calculateResidenceDuration } from "@/lib/utils";
import type { Translator } from "@/lib/i18n";
import { useI18n, useLocale } from "@/hooks/use-i18n";

interface ProfileDetailProps {
  profile: Profile;
  isOwnProfile: boolean;
  teaTimeEnabled?: boolean;
  roomPhotos?: RoomPhoto[];
}

// Helper to translate profile option values
function translateOption(
  value: string | null | undefined,
  category: string,
  options: readonly string[],
  t: Translator
): string | null {
  if (!value) return null;
  // Check if value is a predefined option
  if (options.includes(value as typeof options[number])) {
    return t(`profileOptions.${category}.${value}` as Parameters<Translator>[0]);
  }
  // Return as-is for custom "other" values
  return value;
}

// Helper to translate language array
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

// Individual field display component
function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] text-[#a3a3a3] tracking-wide">{label}</dt>
      <dd className="text-sm text-[#1a1a1a]">{value}</dd>
    </div>
  );
}

// Extended profile sections component
function ExtendedProfileSection({
  profile,
  t,
}: {
  profile: Profile;
  t: Translator;
}) {
  // Basic info fields
  const basicInfoFields = [
    { label: t("profile.nickname"), value: profile.nickname },
    {
      label: t("profile.ageRange"),
      value: translateOption(profile.age_range, "ageRange", AGE_RANGES, t),
    },
    {
      label: t("profile.gender"),
      value: translateOption(profile.gender, "gender", GENDERS, t),
    },
    { label: t("profile.nationality"), value: profile.nationality },
    {
      label: t("profile.languages"),
      value: translateLanguages(profile.languages, t).join(", ") || null,
    },
    { label: t("profile.hometown"), value: profile.hometown },
  ].filter((f) => f.value);

  // Work fields
  const workFields = [
    {
      label: t("profile.occupation"),
      value: translateOption(profile.occupation, "occupation", OCCUPATIONS, t),
    },
    {
      label: t("profile.industry"),
      value: translateOption(profile.industry, "industry", INDUSTRIES, t),
    },
    { label: t("profile.workLocation"), value: profile.work_location },
    {
      label: t("profile.workStyle"),
      value: translateOption(profile.work_style, "workStyle", WORK_STYLES, t),
    },
  ].filter((f) => f.value);

  // Lifestyle fields
  const lifestyleFields = [
    {
      label: t("profile.dailyRhythm"),
      value: translateOption(profile.daily_rhythm, "dailyRhythm", DAILY_RHYTHMS, t),
    },
    {
      label: t("profile.homeFrequency"),
      value: translateOption(profile.home_frequency, "homeFrequency", HOME_FREQUENCIES, t),
    },
    {
      label: t("profile.alcohol"),
      value: translateOption(profile.alcohol, "alcohol", ALCOHOL_OPTIONS, t),
    },
    {
      label: t("profile.smoking"),
      value: translateOption(profile.smoking, "smoking", SMOKING_OPTIONS, t),
    },
    {
      label: t("profile.pets"),
      value: translateOption(profile.pets, "pets", PET_OPTIONS, t),
    },
    {
      label: t("profile.guestFrequency"),
      value: translateOption(profile.guest_frequency, "guestFrequency", GUEST_FREQUENCIES, t),
    },
    {
      label: t("profile.overnightGuests"),
      value: translateOption(profile.overnight_guests, "overnightGuests", OVERNIGHT_OPTIONS, t),
    },
  ].filter((f) => f.value);

  // Communal living fields
  const communalFields = [
    {
      label: t("profile.socialStance"),
      value: translateOption(profile.social_stance, "socialStance", SOCIAL_STANCES, t),
    },
    { label: t("profile.sharedSpaceUsage"), value: profile.shared_space_usage },
    {
      label: t("profile.cleaningAttitude"),
      value: translateOption(profile.cleaning_attitude, "cleaningAttitude", CLEANING_ATTITUDES, t),
    },
    {
      label: t("profile.cookingFrequency"),
      value: translateOption(profile.cooking_frequency, "cookingFrequency", COOKING_FREQUENCIES, t),
    },
    {
      label: t("profile.sharedMeals"),
      value: translateOption(profile.shared_meals, "sharedMeals", SHARED_MEAL_OPTIONS, t),
    },
  ].filter((f) => f.value);

  // Personality fields
  const personalityFields = [
    { label: t("profile.personalityType"), value: profile.personality_type },
    { label: t("profile.weekendActivities"), value: profile.weekend_activities },
  ].filter((f) => f.value);

  const hasAnyExtendedInfo =
    basicInfoFields.length > 0 ||
    workFields.length > 0 ||
    lifestyleFields.length > 0 ||
    communalFields.length > 0 ||
    personalityFields.length > 0;

  if (!hasAnyExtendedInfo) return null;

  return (
    <div className="space-y-5 mb-5">
      {/* Basic Info */}
      {basicInfoFields.length > 0 && (
        <section aria-label={t("profile.sectionBasicInfo")}>
          <h2 className="text-[10px] text-[#a3a3a3] tracking-wide mb-3 border-b border-[#e5e5e5] pb-2">
            {t("profile.sectionBasicInfo")}
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {basicInfoFields.map((field, i) => (
              <ProfileField key={i} label={field.label} value={field.value} />
            ))}
          </dl>
        </section>
      )}

      {/* Work */}
      {workFields.length > 0 && (
        <section aria-label={t("profile.sectionWork")}>
          <h2 className="text-[10px] text-[#a3a3a3] tracking-wide mb-3 border-b border-[#e5e5e5] pb-2">
            {t("profile.sectionWork")}
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {workFields.map((field, i) => (
              <ProfileField key={i} label={field.label} value={field.value} />
            ))}
          </dl>
        </section>
      )}

      {/* Lifestyle */}
      {lifestyleFields.length > 0 && (
        <section aria-label={t("profile.sectionLifestyle")}>
          <h2 className="text-[10px] text-[#a3a3a3] tracking-wide mb-3 border-b border-[#e5e5e5] pb-2">
            {t("profile.sectionLifestyle")}
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {lifestyleFields.map((field, i) => (
              <ProfileField key={i} label={field.label} value={field.value} />
            ))}
          </dl>
        </section>
      )}

      {/* Communal Living */}
      {communalFields.length > 0 && (
        <section aria-label={t("profile.sectionCommunal")}>
          <h2 className="text-[10px] text-[#a3a3a3] tracking-wide mb-3 border-b border-[#e5e5e5] pb-2">
            {t("profile.sectionCommunal")}
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {communalFields.map((field, i) => (
              <ProfileField key={i} label={field.label} value={field.value} />
            ))}
          </dl>
        </section>
      )}

      {/* Personality */}
      {personalityFields.length > 0 && (
        <section aria-label={t("profile.sectionPersonality")}>
          <h2 className="text-[10px] text-[#a3a3a3] tracking-wide mb-3 border-b border-[#e5e5e5] pb-2">
            {t("profile.sectionPersonality")}
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {personalityFields.map((field, i) => (
              <ProfileField key={i} label={field.label} value={field.value} />
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}

/**
 * 住人プロフィール詳細表示コンポーネント
 *
 * アバター、名前、部屋番号、入居期間、自己紹介、MBTI、趣味タグ、
 * ティータイム参加状況を表示する。未登録（モック）プロフィールには
 * 破線スタイルとバナーで区別表示する。
 *
 * @param props.profile - 表示対象のプロフィールデータ
 * @param props.isOwnProfile - 自分のプロフィールかどうか（編集リンク表示に使用）
 * @param props.teaTimeEnabled - ティータイム参加状態
 */
export function ProfileDetail({
  profile,
  isOwnProfile,
  teaTimeEnabled,
  roomPhotos = [],
}: ProfileDetailProps) {
  const isMockProfile = profile.id.startsWith("mock-");
  const t = useI18n();
  const locale = useLocale();
  const localeTag = locale === "ja" ? "ja-JP" : "en-US";

  return (
    <m.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#1a1a1a] mb-4 transition-colors"
        aria-label={t("a11y.backToResidents")}
      >
        <span aria-hidden="true">←</span>
        <span>{t("common.back")}</span>
      </Link>

      {/* Unregistered profile banner */}
      {isMockProfile && (
        <m.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="mb-4 py-3 px-4 border border-dashed border-[#d4d4d4] bg-[#fafaf8]"
          role="alert"
        >
          <p className="text-sm text-[#737373]">
            {t("profile.mockProfileBanner")}
          </p>
          <p className="text-xs text-[#a3a3a3] mt-1">
            {t("profile.mockProfileSubtext")}
          </p>
        </m.div>
      )}

      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={`bg-white border ${
          isMockProfile
            ? "border-dashed border-[#d4d4d4]"
            : "border-[#e5e5e5]"
        }`}
      >
        {/* Horizontal layout */}
        <div className="flex flex-col sm:flex-row">
          {/* Avatar */}
          <div className="sm:w-1/3 aspect-square sm:aspect-auto bg-[#f5f5f3] flex items-center justify-center overflow-hidden">
            <Avatar className="w-full h-full rounded-none">
              <OptimizedAvatarImage
                src={profile.avatar_url}
                alt={t("a11y.profilePhotoAlt", { name: profile.name })}
                context="detail"
                priority
                fallback={getInitials(profile.name)}
                fallbackClassName="bg-[#f5f5f3] text-[#a3a3a3] text-5xl sm:text-6xl rounded-none w-full h-full"
              />
            </Avatar>
          </div>

          {/* Info */}
          <div className="flex-1 p-5 sm:p-6">
            {/* Name and edit button */}
            <header className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h1 className="text-xl text-[#1a1a1a] tracking-wide font-light">
                  {profile.name}
                </h1>
                {profile.room_number && (
                  <p className="text-sm text-[#737373] mt-1">
                    {profile.room_number}{t("profile.room")}
                  </p>
                )}
              </div>
              {isOwnProfile && (
                <Link
                  href={`/profile/${profile.id}/edit`}
                  className="px-4 py-2 border border-[#e5e5e5] text-xs text-[#737373] tracking-wide hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors shrink-0"
                >
                  {t("common.edit")}
                </Link>
              )}
            </header>

            {/* Move-in info */}
            {profile.move_in_date && (
              <dl className="flex items-center gap-6 py-4 border-y border-[#e5e5e5] mb-5">
                <div>
                  <dt className="text-[10px] text-[#a3a3a3] tracking-wide mb-1">
                    {t("profile.moveInDate")}
                  </dt>
                  <dd className="text-sm text-[#1a1a1a]">
                    {formatDate(profile.move_in_date, undefined, localeTag)}
                  </dd>
                </div>
                <div className="w-px h-8 bg-[#e5e5e5]" aria-hidden="true" />
                <div>
                  <dt className="text-[10px] text-[#a3a3a3] tracking-wide mb-1">
                    {t("profile.residenceDuration")}
                  </dt>
                  <dd className="text-sm text-[#1a1a1a]">
                    {calculateResidenceDuration(profile.move_in_date, t)}
                  </dd>
                </div>
              </dl>
            )}

            {/* Bio */}
            {profile.bio && (
              <section className="mb-5" aria-label={t("profile.bio")}>
                <p className="text-sm text-[#1a1a1a] leading-relaxed">
                  {profile.bio}
                </p>
              </section>
            )}

            {/* MBTI & Interests */}
            {(profile.mbti || (profile.interests && profile.interests.length > 0)) && (
              <section className="mb-5" aria-label={t("profile.interests")}>
                <ul className="flex flex-wrap gap-2">
                  {profile.mbti && (
                    <li className="text-xs px-3 py-1.5 bg-[#f5f5f3] text-[#1a1a1a] font-medium">
                      {profile.mbti}
                      <span className="text-[#737373] font-normal ml-1.5">
                        {MBTI_LABELS[profile.mbti][locale === "ja" ? "ja" : "en"]}
                      </span>
                    </li>
                  )}
                  {profile.interests?.map((interest, index) => (
                    <li
                      key={index}
                      className="text-xs px-3 py-1.5 bg-[#f5f5f3] text-[#737373]"
                    >
                      {interest}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Room Photos */}
            {roomPhotos.length > 0 && (
              <section className="mb-5" aria-label={t("roomPhotos.roomPhotosSection")}>
                <h2 className="text-[10px] text-[#a3a3a3] tracking-wide mb-3">
                  {t("roomPhotos.roomPhotosSection")}
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {roomPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square bg-[#f5f5f3] overflow-hidden"
                    >
                      <img
                        src={photo.photo_url}
                        alt={photo.caption || t("roomPhotos.roomPhotosSection")}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Extended Profile Sections */}
            <ExtendedProfileSection profile={profile} t={t} />

            {/* Tea Time status */}
            <footer className="flex items-center gap-3 pt-4 border-t border-[#e5e5e5]">
              <span className="text-xs text-[#a3a3a3] tracking-wide">
                {t("teaTime.title")}
              </span>
              <span
                className={`text-xs px-2 py-0.5 ${
                  teaTimeEnabled
                    ? "bg-[#f8faf8] text-[#6b8b6b]"
                    : "bg-[#f5f5f3] text-[#a3a3a3]"
                }`}
              >
                {teaTimeEnabled
                  ? t("teaTime.participating")
                  : t("teaTime.notParticipating")}
              </span>
            </footer>
          </div>
        </div>
      </m.div>
    </m.article>
  );
}
