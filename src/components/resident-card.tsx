"use client";

import { memo, useMemo, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { m, AnimatePresence, type Variants } from "framer-motion";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/domain/profile";
import { getInitials } from "@/lib/utils";
import { PROFILE } from "@/lib/constants/config";
import { getMBTIGroup } from "@/domain/profile";
import { MBTI_COLORS } from "@/lib/constants/mbti";
import { useI18n } from "@/hooks/use-i18n";
import type { Translator } from "@/lib/i18n";

interface ResidentCardProps {
  profile: Profile;
  isCurrentUser?: boolean;
  floorAccent?: string;
  showTeaTime?: boolean;
  teaTimeEnabled?: boolean;
}

interface ResidenceDuration {
  months: number;
  isNew: boolean;
}

type SnsPlatform = "x" | "instagram" | "github";

interface SnsLink {
  platform: SnsPlatform;
  username: string;
}

type BadgeVariant = "default" | "dark" | "success" | "muted";

const ANIMATION_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const;

const CARD_HEIGHTS = {
  mobile: "min-h-[88px]",
  desktop: "sm:min-h-[100px]",
} as const;

const NEW_RESIDENT_THRESHOLD_MONTHS = 3;

/**
 * 入居期間を計算する
 * 
 * @param moveInDate - 入居日（ISO形式文字列）
 * @returns 入居期間情報（入居日未設定時はnull）
 */
function calculateResidenceDuration(moveInDate: string | null | undefined): ResidenceDuration | null {
  if (!moveInDate) return null;

  const moveIn = new Date(moveInDate);
  if (Number.isNaN(moveIn.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - moveIn.getTime();
  const months = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30)));

  return {
    months,
    isNew: months <= NEW_RESIDENT_THRESHOLD_MONTHS,
  };
}

function formatResidenceDuration(duration: ResidenceDuration, t: Translator): string {
  const { months } = duration;

  if (months < 1) return t("profile.justMovedIn");
  if (months < 12) return t("profile.residenceMonths", { count: months });

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return t("profile.residenceYears", { count: years });
  }
  return t("profile.residenceYearsMonths", { years, months: remainingMonths });
}

function extractSnsLinks(profile: Profile): SnsLink[] {
  const links: SnsLink[] = [];

  if (profile.sns_x) links.push({ platform: "x", username: profile.sns_x });
  if (profile.sns_instagram) links.push({ platform: "instagram", username: profile.sns_instagram });
  if (profile.sns_github) links.push({ platform: "github", username: profile.sns_github });

  return links;
}

function isMockProfile(profileId: string): boolean {
  return profileId.startsWith("mock-");
}

function getCardBorderClass(isCurrentUser: boolean, isMock: boolean): string {
  if (isCurrentUser) return "border-primary";
  if (isMock) return "border-border hover:border-primary/70"; // Make it solid, just slightly less aggressive hover than real users
  return "border-border hover:border-primary";
}

function Badge({
  variant = "default",
  children,
  className = "",
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-secondary text-muted-foreground",
    dark: "bg-primary text-primary-foreground",
    success: "bg-success-bg text-success border border-success-border",
    muted: "bg-card/90 backdrop-blur-sm text-muted-foreground",
  };

  return (
    <span
      className={`text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full tracking-wide font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

function SnsIcon({ platform }: { platform: SnsPlatform }) {
  const iconProps: ComponentProps<"svg"> = {
    width: 10,
    height: 10,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true,
  };

  const paths: Record<SnsPlatform, string> = {
    x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    instagram:
      "M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 011.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772 4.915 4.915 0 01-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z",
    github:
      "M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z",
  };

  return (
    <svg {...iconProps}>
      <path d={paths[platform]} />
    </svg>
  );
}

const OverlayIcons = {
  Calendar: () => (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M4 0v2H2a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2h-2V0h-2v2H6V0H4zm0 7h2v2H4V7zm4 0h2v2H8V7zm4 0h2v2h-2V7zM4 11h2v2H4v-2zm4 0h2v2H8v-2z" />
    </svg>
  ),
  Briefcase: () => (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M6 0a2 2 0 00-2 2v1H2a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2V2a2 2 0 00-2-2H6zm0 2h4v1H6V2z" />
    </svg>
  ),
  Clock: () => (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 2a6 6 0 110 12A6 6 0 018 2zm-.5 2v5l3.5 2-.5 1-4-2.5V4h1z" />
    </svg>
  ),
  Users: () => (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M5 5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm0 1C2.5 6 0 7.5 0 9v1h10V9c0-1.5-2.5-3-5-3zm6-1a2 2 0 100-4 2 2 0 000 4zm0 1c-1 0-2 .3-2.7.8.5.6.7 1.3.7 2.2v1h6V9c0-1.2-2-3-4-3z" />
    </svg>
  ),
  TeaCup: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 6h10v5a3 3 0 01-3 3H5a3 3 0 01-3-3V6z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7h1a2 2 0 110 4h-1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 3c0-1 .5-2 2-2s2 1 2 2" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
} as const;

function OverlayInfoRow({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType;
  children: ReactNode;
}) {
  return (
    <p className="text-[10px] text-white/80 flex items-center gap-1">
      <Icon />
      {children}
    </p>
  );
}

function InterestTagList({
  interests,
  ariaLabel,
}: {
  interests: string[];
  ariaLabel: string;
}) {
  if (interests.length === 0) return null;

  return (
    <ul
      className="flex flex-wrap gap-1 sm:gap-1.5 overflow-hidden max-h-[26px] sm:max-h-[28px] shrink-0"
      aria-label={ariaLabel}
    >
      {interests.map((interest, index) => (
        <li
          key={`${interest}-${index}`}
          className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground"
        >
          {interest}
        </li>
      ))}
    </ul>
  );
}

function useResidentCardData(profile: Profile, t: Translator) {
  return useMemo(() => {
    const isMock = isMockProfile(profile.id);
    const residenceDuration = calculateResidenceDuration(profile.move_in_date);
    const isNewResident = residenceDuration?.isNew ?? false;
    const snsLinks = extractSnsLinks(profile);
    const hasSns = snsLinks.length > 0;

    const displayInterests = profile.interests?.slice(0, PROFILE.maxInterestsDisplay.card) ?? [];

    const occupationLabel = profile.occupation
      ? t(`profileOptions.occupation.${profile.occupation}` as Parameters<typeof t>[0])
      : null;

    const displayName = profile.nickname || profile.name;

    return {
      isMock,
      residenceDuration,
      isNewResident,
      snsLinks,
      hasSns,
      displayInterests,
      occupationLabel,
      displayName,
    };
  }, [profile, t]);
}

/**
 * 住民カードコンポーネント
 *
 * 住民一覧で使用するプロフィールカード。
 * ホバー時に追加情報を表示し、クリックで詳細ページへ遷移する。
 */
export const ResidentCard = memo(function ResidentCard({
  profile,
  isCurrentUser = false,
  floorAccent,
  showTeaTime = false,
  teaTimeEnabled = false,
}: ResidentCardProps) {
  const t = useI18n();

  const {
    isMock,
    residenceDuration,
    isNewResident,
    snsLinks,
    hasSns,
    displayInterests,
    occupationLabel,
    displayName,
  } = useResidentCardData(profile, t);

  const borderClass = getCardBorderClass(isCurrentUser, isMock);

  const floorAccentStyle = useMemo(() => {
    if (!floorAccent || isCurrentUser || isMock) return undefined;
    return { borderBottomColor: floorAccent, borderBottomWidth: "2px" };
  }, [floorAccent, isCurrentUser, isMock]);

  return (
    <Link
      href={`/profile/${profile.id}`}
      aria-label={t("a11y.viewProfile", { name: profile.name })}
      className="block h-full group select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      prefetch={false}
    >
      <article
        className={`h-full bg-card border rounded-2xl transition-all duration-300 relative overflow-hidden group-hover:-translate-y-0.5 group-hover:shadow-lg flex flex-col shadow-sm ${borderClass}`}
        style={floorAccentStyle}
      >
        <div className="aspect-square bg-muted relative overflow-hidden">
          <Avatar className="w-full h-full rounded-none">
            <OptimizedAvatarImage
              src={profile.avatar_url}
              alt={t("a11y.profilePhotoAlt", { name: profile.name })}
              context="card"
              className="w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
              fallback={getInitials(profile.name)}
              fallbackClassName="bg-muted text-muted-foreground/40 text-3xl sm:text-4xl font-semibold rounded-none w-full h-full flex items-center justify-center"
              fallbackAriaLabel={t("a11y.profileInitials", { name: profile.name })}
            />
          </Avatar>

          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {isMock && !isCurrentUser && (
              <Badge variant="muted" className="bg-primary/5 text-primary border border-primary/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider">{t("common.unregistered")}</Badge>
            )}
            {isNewResident && !isMock && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold tracking-wider">{t("residents.badgeNew")}</span>
            )}
            {profile.mbti && !isMock && (() => {
              const group = getMBTIGroup(profile.mbti);
              const colors = MBTI_COLORS[group];
              return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold shadow-sm backdrop-blur-sm ${colors.bg} ${colors.text} ${colors.border}`}>
                  {profile.mbti}
                </span>
              );
            })()}
          </div>

          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {isCurrentUser && (
              <Badge variant="dark" className="bg-brand-500 text-white border-none text-[10px] font-bold tracking-wider uppercase">{t("residents.badgeYou")}</Badge>
            )}
            {showTeaTime && teaTimeEnabled && !isMock && (
              <span className="bg-warning-bg/90 backdrop-blur-sm text-warning border-none text-[10px] px-2 py-1 font-bold rounded-lg flex items-center gap-1 shadow-sm">
                <OverlayIcons.TeaCup />
              </span>
            )}
          </div>


          {profile.vibe?.message && !isMock && (
            <div className="absolute inset-x-3 bottom-3 z-10">
              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/95 backdrop-blur-md rounded-2xl p-3 shadow-md border border-border/30"
              >
                <div className="relative">
                  <div className="absolute -top-5 left-3 w-0 h-0 border-8 border-transparent border-b-card/95" />
                  <p className="text-[10px] sm:text-[11px] font-medium text-foreground line-clamp-2 leading-snug">
                    {profile.vibe.message}
                  </p>
                </div>
              </m.div>
            </div>
          )}

          <AnimatePresence>
            {!isMock && (
              <m.div
                variants={ANIMATION_VARIANTS}
                initial="hidden"
                whileHover="visible"
                className="absolute inset-0 bg-primary/70 backdrop-blur-[3px] hidden sm:flex flex-col justify-center items-center p-6 opacity-0 hover:opacity-100 transition-opacity duration-300 z-20"
              >
                <div className="space-y-4 w-full">
                  {residenceDuration && (
                    <OverlayInfoRow icon={OverlayIcons.Calendar}>
                      <span className="font-medium text-white text-sm">{formatResidenceDuration(residenceDuration, t)}</span>
                    </OverlayInfoRow>
                  )}
                  {profile.work_style && (
                    <OverlayInfoRow icon={OverlayIcons.Briefcase}>
                      <span className="font-medium text-white text-sm">{t(`profileOptions.workStyle.${profile.work_style}` as Parameters<typeof t>[0])}</span>
                    </OverlayInfoRow>
                  )}
                  {profile.daily_rhythm && (
                    <OverlayInfoRow icon={OverlayIcons.Clock}>
                      <span className="font-medium text-white text-sm">{t(`profileOptions.dailyRhythm.${profile.daily_rhythm}` as Parameters<typeof t>[0])}</span>
                    </OverlayInfoRow>
                  )}
                  {hasSns && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/20 mt-2">
                      {snsLinks.map((link) => (
                        <span
                          key={link.platform}
                          className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white"
                        >
                          <SnsIcon platform={link.platform} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        <div className={`p-4 sm:p-5 ${CARD_HEIGHTS.mobile} ${CARD_HEIGHTS.desktop} flex-1 flex flex-col overflow-hidden bg-card`}>
          <div className="flex items-center justify-between gap-2 shrink-0">
            <h3 className="text-base sm:text-lg text-foreground tracking-tight truncate font-semibold">
              {displayName}
            </h3>
            {profile.room_number && (
              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium bg-secondary px-2.5 py-0.5 rounded-full">
                {profile.room_number}
              </span>
            )}
          </div>

          {occupationLabel && !isMock && (
            <p className="text-xs text-muted-foreground mt-1 truncate shrink-0">
              {occupationLabel}
            </p>
          )}

          <div className="flex-1" aria-hidden="true" />

          <InterestTagList
            interests={displayInterests}
            ariaLabel={t("a11y.interestsList")}
          />
        </div>
      </article>
    </Link>
  );
});

ResidentCard.displayName = "ResidentCard";
