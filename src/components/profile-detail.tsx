"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile, MBTI_LABELS } from "@/domain/profile";
import { getInitials, formatDate, calculateResidenceDuration } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { normalizeLocale } from "@/lib/i18n";

interface ProfileDetailProps {
  profile: Profile;
  isOwnProfile: boolean;
  teaTimeEnabled?: boolean;
}

/**
 * Profile detail view component
 */
export function ProfileDetail({
  profile,
  isOwnProfile,
  teaTimeEnabled,
}: ProfileDetailProps) {
  const isMockProfile = profile.id.startsWith("mock-");
  const t = useI18n();
  const locale = normalizeLocale(
    typeof document !== "undefined"
      ? document.documentElement.lang || navigator.language
      : undefined
  );
  const localeTag = locale === "ja" ? "ja-JP" : "en-US";

  return (
    <motion.article
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
        <motion.div
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
        </motion.div>
      )}

      <motion.div
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
              <AvatarImage
                src={profile.avatar_url || undefined}
                alt={t("a11y.profilePhotoAlt", { name: profile.name })}
                className="object-cover w-full h-full"
              />
              <AvatarFallback className="bg-[#f5f5f3] text-[#a3a3a3] text-5xl sm:text-6xl rounded-none w-full h-full">
                {getInitials(profile.name)}
              </AvatarFallback>
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
      </motion.div>
    </motion.article>
  );
}
