import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Profile } from "@/types/profile";
import { getInitials, formatDate, calculateResidenceDuration } from "@/lib/utils";
import { t } from "@/lib/i18n";

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

  return (
    <article>
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-[#737373] hover:text-[#1a1a1a] mb-2 sm:mb-3 transition-colors"
        aria-label="住民一覧に戻る"
      >
        <span aria-hidden="true">←</span>
        <span>{t("common.back")}</span>
      </Link>

      {/* Unregistered profile banner */}
      {isMockProfile && (
        <div
          className="mb-3 p-4 border border-dashed border-[#d4d4d4] bg-[#fafaf8]"
          role="alert"
        >
          <p className="text-sm text-[#737373]">
            {t("profile.mockProfileBanner")}
          </p>
          <p className="text-xs text-[#a3a3a3] mt-1">
            {t("profile.mockProfileSubtext")}
          </p>
        </div>
      )}

      <div
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
                alt={`${profile.name}のプロフィール写真`}
                className="object-cover w-full h-full"
              />
              <AvatarFallback className="bg-[#f5f5f3] text-[#a3a3a3] text-5xl rounded-none w-full h-full">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Info */}
          <div className="flex-1 p-4 sm:p-5">
            {/* Name and edit button */}
            <header className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl text-[#1a1a1a] tracking-wide">
                  {profile.name}
                </h1>
                {profile.room_number && (
                  <p className="text-sm text-[#737373]">
                    {profile.room_number}{t("profile.room")}
                  </p>
                )}
              </div>
              {isOwnProfile && (
                <Link href={`/profile/${profile.id}/edit`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none border-[#e5e5e5] text-[#737373] hover:border-[#b94a48] hover:text-[#b94a48] h-7 text-xs"
                  >
                    {t("common.edit")}
                  </Button>
                </Link>
              )}
            </header>

            {/* Move-in info */}
            {profile.move_in_date && (
              <dl className="flex items-center gap-4 py-3 border-y border-[#e5e5e5] mb-4 text-sm">
                <div>
                  <dt className="text-[10px] text-[#a3a3a3]">
                    {t("profile.moveInDate")}
                  </dt>
                  <dd className="text-[#1a1a1a]">
                    {formatDate(profile.move_in_date)}
                  </dd>
                </div>
                <div className="w-px h-6 bg-[#e5e5e5]" aria-hidden="true" />
                <div>
                  <dt className="text-[10px] text-[#a3a3a3]">
                    {t("profile.residenceDuration")}
                  </dt>
                  <dd className="text-[#1a1a1a]">
                    {calculateResidenceDuration(profile.move_in_date)}
                  </dd>
                </div>
              </dl>
            )}

            {/* Bio */}
            {profile.bio && (
              <section className="mb-4" aria-label={t("profile.bio")}>
                <p className="text-sm text-[#1a1a1a] leading-relaxed">
                  {profile.bio}
                </p>
              </section>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <section className="mb-4" aria-label={t("profile.interests")}>
                <ul className="flex flex-wrap gap-1.5">
                  {profile.interests.map((interest, index) => (
                    <li
                      key={index}
                      className="text-xs px-2 py-1 bg-[#f5f5f3] text-[#737373]"
                    >
                      {interest}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Tea Time status */}
            <footer className="flex items-center gap-2 pt-3 border-t border-[#e5e5e5]">
              <span className="text-base" aria-hidden="true">☕</span>
              <span
                className={`text-xs ${
                  teaTimeEnabled ? "text-[#16a34a]" : "text-[#a3a3a3]"
                }`}
              >
                {t("teaTime.title")}{" "}
                {teaTimeEnabled
                  ? t("teaTime.participating")
                  : t("teaTime.notParticipating")}
              </span>
            </footer>
          </div>
        </div>
      </div>
    </article>
  );
}
