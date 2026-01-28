"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Profile, MBTI_TYPES, MBTI_LABELS, MBTIType } from "@/domain/profile";
import { updateProfile, uploadAvatar } from "@/lib/profile/actions";
import { updateTeaTimeSetting } from "@/lib/tea-time/actions";
import { getInitials } from "@/lib/utils";
import { useI18n, useLocale } from "@/hooks/use-i18n";

interface ProfileEditFormProps {
  profile: Profile;
  initialTeaTimeEnabled?: boolean;
}

/**
 * プロフィール編集フォームコンポーネント
 *
 * 左カラムにリアルタイムプレビュー（アバター・名前・趣味タグ）・
 * プロフィール完成度メーター・ティータイム参加トグルを表示し、
 * 右カラムに編集フォーム（名前・部屋番号・入居日・MBTI・自己紹介・趣味）を配置する。
 * アバターアップロードはFormData経由のサーバーアクションで処理する。
 *
 * @param props.profile - 編集対象のプロフィールデータ
 * @param props.initialTeaTimeEnabled - ティータイム参加の初期状態（デフォルト: false）
 */
export function ProfileEditForm({ profile, initialTeaTimeEnabled = false }: ProfileEditFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useI18n();
  const locale = useLocale();

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTeaTimeLoading, setIsTeaTimeLoading] = useState(false);
  const [teaTimeEnabled, setTeaTimeEnabled] = useState(initialTeaTimeEnabled);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [formData, setFormData] = useState({
    name: profile.name,
    room_number: profile.room_number || "",
    bio: profile.bio || "",
    interests: profile.interests?.join(", ") || "",
    mbti: profile.mbti || ("" as MBTIType | ""),
    move_in_date: profile.move_in_date || "",
    // 基本情報
    nickname: profile.nickname || "",
    age_range: profile.age_range || "",
    gender: profile.gender || "",
    nationality: profile.nationality || "",
    languages: profile.languages || [],
    hometown: profile.hometown || "",
    // 仕事・学歴
    occupation: profile.occupation || "",
    industry: profile.industry || "",
    work_location: profile.work_location || "",
    work_style: profile.work_style || "",
    // ライフスタイル
    daily_rhythm: profile.daily_rhythm || "",
    home_frequency: profile.home_frequency || "",
    alcohol: profile.alcohol || "",
    smoking: profile.smoking || "",
    pets: profile.pets || "",
    guest_frequency: profile.guest_frequency || "",
    // 共同生活への姿勢
    social_stance: profile.social_stance || "",
    shared_space_usage: profile.shared_space_usage || "",
    cleaning_attitude: profile.cleaning_attitude || "",
    cooking_frequency: profile.cooking_frequency || "",
    shared_meals: profile.shared_meals || "",
    // 性格・趣味
    personality_type: profile.personality_type || "",
    weekend_activities: profile.weekend_activities || "",
    // SNS
    sns_x: profile.sns_x || "",
    sns_instagram: profile.sns_instagram || "",
    sns_facebook: profile.sns_facebook || "",
    sns_linkedin: profile.sns_linkedin || "",
    sns_github: profile.sns_github || "",
  });
  const [expandedSections, setExpandedSections] = useState<string[]>(["basic"]);

  const interestsArray = useMemo(
    () =>
      formData.interests
        .split(/[,、・]/)
        .map((i) => i.trim())
        .filter((i) => i.length > 0),
    [formData.interests]
  );

  const completionItems = useMemo(
    () => [
      { label: t("profile.completionItems.photo"), completed: !!avatarUrl },
      { label: t("profile.completionItems.name"), completed: !!formData.name.trim() },
      {
        label: t("profile.completionItems.roomNumber"),
        completed: !!formData.room_number.trim(),
      },
      { label: t("profile.completionItems.bio"), completed: !!formData.bio.trim() },
      { label: t("profile.completionItems.interests"), completed: !!formData.interests.trim() },
    ],
    [avatarUrl, formData.name, formData.room_number, formData.bio, formData.interests, t]
  );
  const completedCount = completionItems.filter((i) => i.completed).length;
  const completionPercentage = Math.round(
    (completedCount / completionItems.length) * 100
  );

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");
    setSuccess(false);

    const formDataUpload = new FormData();
    formDataUpload.append("avatar", file);

    const result = await uploadAvatar(formDataUpload);

    if ("error" in result) {
      setError(result.error);
    } else if ("url" in result) {
      setAvatarUrl(result.url);
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError(t("auth.nameRequired"));
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    const result = await updateProfile({
      name: formData.name.trim(),
      room_number: formData.room_number.trim() || null,
      bio: formData.bio.trim() || null,
      interests: interestsArray,
      mbti: formData.mbti || null,
      move_in_date: formData.move_in_date || null,
      // 基本情報
      nickname: formData.nickname.trim() || null,
      age_range: formData.age_range || null,
      gender: formData.gender || null,
      nationality: formData.nationality.trim() || null,
      languages: formData.languages,
      hometown: formData.hometown.trim() || null,
      // 仕事・学歴
      occupation: formData.occupation || null,
      industry: formData.industry.trim() || null,
      work_location: formData.work_location.trim() || null,
      work_style: formData.work_style || null,
      // ライフスタイル
      daily_rhythm: formData.daily_rhythm || null,
      home_frequency: formData.home_frequency || null,
      alcohol: formData.alcohol || null,
      smoking: formData.smoking || null,
      pets: formData.pets || null,
      guest_frequency: formData.guest_frequency || null,
      // 共同生活への姿勢
      social_stance: formData.social_stance || null,
      shared_space_usage: formData.shared_space_usage.trim() || null,
      cleaning_attitude: formData.cleaning_attitude || null,
      cooking_frequency: formData.cooking_frequency || null,
      shared_meals: formData.shared_meals || null,
      // 性格・趣味
      personality_type: formData.personality_type.trim() || null,
      weekend_activities: formData.weekend_activities.trim() || null,
      // SNS
      sns_x: formData.sns_x.trim() || null,
      sns_instagram: formData.sns_instagram.trim() || null,
      sns_facebook: formData.sns_facebook.trim() || null,
      sns_linkedin: formData.sns_linkedin.trim() || null,
      sns_github: formData.sns_github.trim() || null,
    });

    setIsLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }, [formData, interestsArray, t]);

  const handleTeaTimeToggle = async (checked: boolean) => {
    setIsTeaTimeLoading(true);
    setTeaTimeEnabled(checked);

    const result = await updateTeaTimeSetting(checked);

    if ("error" in result) {
      setTeaTimeEnabled(!checked);
    }

    setIsTeaTimeLoading(false);
  };

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl text-[#1a1a1a] tracking-wide font-light">
          {t("profile.editTitle")}
        </h1>
        <Link
          href={`/profile/${profile.id}`}
          className="text-xs text-[#737373] hover:text-[#1a1a1a] transition-colors"
        >
          {t("profile.viewPublicProfile")}
        </Link>
      </div>

      {/* メッセージ */}
      <AnimatePresence mode="wait">
        {error && (
          <m.div
            key="error"
            role="alert"
            aria-live="polite"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="py-3 px-4 bg-[#faf8f8] border-l-2 border-[#c9a0a0]"
          >
            <p className="text-sm text-[#8b6b6b]">{error}</p>
          </m.div>
        )}
        {success && (
          <m.div
            key="success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="py-3 px-4 bg-[#f8faf8] border-l-2 border-[#a0c9a0]"
          >
            <p className="text-sm text-[#6b8b6b]">{t("profile.saved")}</p>
          </m.div>
        )}
      </AnimatePresence>

      <div className="grid gap-5 md:grid-cols-5">
        {/* 左：プレビュー */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="md:col-span-2 md:self-start md:sticky md:top-4 space-y-4"
        >
          {/* プロフィールカードプレビュー */}
          <div className="bg-white border border-[#e5e5e5]">
            <div className="px-4 py-3 border-b border-[#e5e5e5]">
              <p className="text-xs text-[#a3a3a3] tracking-wide">
                {t("profile.preview")}
              </p>
            </div>
            <div className="p-4">
              {/* アバター */}
              <div className="w-full max-w-[240px] mx-auto mb-4">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  className="relative w-full aspect-square bg-[#f5f5f3] group block"
                >
                  <Avatar className="absolute inset-0 size-full rounded-none">
                  <OptimizedAvatarImage
                    src={avatarUrl}
                    context="edit"
                    alt={t("a11y.profilePhotoAlt", { name: formData.name || "?" })}
                    fallback={getInitials(formData.name || "?")}
                    fallbackClassName="bg-[#f5f5f3] text-[#a3a3a3] text-4xl rounded-none"
                  />
                </Avatar>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs tracking-wide">
                    {isUploading ? t("profile.uploadingPhoto") : t("profile.changePhoto")}
                  </span>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <m.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="inline-block w-6 h-6 border border-[#d4d4d4] border-t-[#1a1a1a] rounded-full"
                    />
                  </div>
                )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />

              {/* 名前・部屋番号 */}
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <h3 className="text-sm text-[#1a1a1a] tracking-wide truncate">
                  {formData.name || t("profile.nameUnset")}
                </h3>
                {formData.room_number && (
                  <span className="text-[10px] text-[#a3a3a3] shrink-0">
                    {formData.room_number}
                  </span>
                )}
              </div>

              {/* 趣味タグ */}
              {interestsArray.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {interestsArray.slice(0, 3).map((interest, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 bg-[#f5f5f3] text-[#737373]"
                    >
                      {interest}
                    </span>
                  ))}
                  {interestsArray.length > 3 && (
                    <span className="text-[10px] text-[#a3a3a3]">
                      +{interestsArray.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 完成度 */}
          <div className="bg-white border border-[#e5e5e5] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#737373]">{t("profile.completionLabel")}</p>
              <p className="text-sm text-[#1a1a1a]">{completionPercentage}%</p>
            </div>
            <div className="h-px bg-[#e5e5e5] mb-3">
              <m.div
                className="h-full bg-[#1a1a1a]"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {completionItems.map((item) => (
                <span
                  key={item.label}
                  className={`text-[10px] px-2 py-0.5 ${
                    item.completed
                      ? "bg-[#f8faf8] text-[#6b8b6b]"
                      : "bg-[#f5f5f3] text-[#a3a3a3]"
                  }`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* ティータイム設定 */}
          <m.div
            animate={{
              backgroundColor: teaTimeEnabled ? "#f8faf8" : "#ffffff",
              borderColor: teaTimeEnabled ? "#a0c9a0" : "#e5e5e5",
            }}
            transition={{ duration: 0.3 }}
            className="bg-white border p-5 sm:p-4"
          >
            <button
              type="button"
              onClick={() => !isTeaTimeLoading && handleTeaTimeToggle(!teaTimeEnabled)}
              disabled={isTeaTimeLoading}
              className="w-full text-left group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <m.div
                      animate={{
                        scale: teaTimeEnabled ? 1 : 0.9,
                        opacity: teaTimeEnabled ? 1 : 0.4,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg
                        className="w-4 h-4 sm:w-3.5 sm:h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: teaTimeEnabled ? "#6b8b6b" : "#a3a3a3" }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 6h18M3 12h18M3 18h18"
                        />
                      </svg>
                    </m.div>
                    <p className={`text-sm sm:text-xs tracking-wide transition-colors ${
                      teaTimeEnabled ? "text-[#6b8b6b] font-medium" : "text-[#737373]"
                    }`}>
                      {t("profile.teaTimeStatus")}
                    </p>
                  </div>

                  <m.p
                    animate={{
                      color: teaTimeEnabled ? "#6b8b6b" : "#a3a3a3",
                    }}
                    transition={{ duration: 0.3 }}
                    className="text-xs sm:text-[10px] leading-relaxed"
                  >
                    {teaTimeEnabled
                      ? t("teaTime.participating")
                      : t("teaTime.notParticipating")}
                  </m.p>

                  {teaTimeEnabled && (
                    <m.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                      className="text-[10px] text-[#8ba88b] mt-2"
                    >
                      {t("teaTime.matchingTarget")}
                    </m.p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <AnimatePresence mode="wait">
                    {isTeaTimeLoading ? (
                      <m.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <m.span
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="inline-block w-5 h-5 border border-[#d4d4d4] border-t-[#1a1a1a] rounded-full"
                        />
                      </m.div>
                    ) : (
                      <m.div
                        key="switch"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Switch
                          checked={teaTimeEnabled}
                          onCheckedChange={handleTeaTimeToggle}
                          disabled={isTeaTimeLoading}
                          className="data-[state=checked]:bg-[#6b8b6b] scale-110 sm:scale-100"
                        />
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </button>
          </m.div>

          {/* 写真アップロードのヒント */}
        <p className="text-[10px] text-[#a3a3a3] text-center">
          {t("profile.photoHintMobile")}
          <br className="sm:hidden" />
          <span className="hidden sm:inline">・</span>
          {t("profile.photoFormat")}
        </p>
        </m.div>

        {/* 右：編集フォーム */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="md:col-span-3"
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#e5e5e5]"
          >
            <div className="px-4 py-3 border-b border-[#e5e5e5]">
              <p className="text-xs text-[#a3a3a3] tracking-wide">
                {t("profile.basicInfo")}
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-5">
              {/* 名前 */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-xs text-[#737373] tracking-wide"
                >
                  {t("auth.name")}
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={t("auth.namePlaceholder")}
                  required
                  className="w-full h-12 sm:h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-base sm:text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
                />
              </div>

              {/* 部屋番号・入居日 */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <div className="space-y-2">
                <label
                  htmlFor="room_number"
                  className="block text-xs text-[#737373] tracking-wide"
                >
                  {t("profile.roomNumber")}
                </label>
                  <input
                    id="room_number"
                    type="text"
                    value={formData.room_number}
                    onChange={(e) =>
                      setFormData({ ...formData, room_number: e.target.value })
                    }
                    placeholder="301"
                    className="w-full h-12 sm:h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-base sm:text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
                  />
                </div>
                <div className="space-y-2">
                <label
                  htmlFor="move_in_date"
                  className="block text-xs text-[#737373] tracking-wide"
                >
                  {t("profile.moveInDate")}
                </label>
                  <input
                    id="move_in_date"
                    type="date"
                    value={formData.move_in_date}
                    onChange={(e) =>
                      setFormData({ ...formData, move_in_date: e.target.value })
                    }
                    className="w-full h-12 sm:h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-base sm:text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
                  />
                </div>
              </div>

              {/* MBTI */}
              <div className="space-y-2">
                <label
                  htmlFor="mbti"
                  className="block text-xs text-[#737373] tracking-wide"
                >
                  {t("profile.mbti")}
                </label>
                <select
                  id="mbti"
                  value={formData.mbti}
                  onChange={(e) =>
                    setFormData({ ...formData, mbti: e.target.value as MBTIType | "" })
                  }
                  className="w-full h-12 sm:h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-base sm:text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors"
                >
                  <option value="">{t("profile.mbtiPlaceholder")}</option>
                  {MBTI_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type} - {MBTI_LABELS[type][locale === "ja" ? "ja" : "en"]}
                    </option>
                  ))}
                </select>
              </div>

              {/* 自己紹介 */}
              <div className="space-y-2">
                <label
                  htmlFor="bio"
                  className="block text-xs text-[#737373] tracking-wide"
                >
                  {t("profile.bio")}
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder={t("profile.bioPlaceholder")}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* 趣味・関心 */}
              <div className="space-y-2">
                <label
                  htmlFor="interests"
                  className="block text-xs text-[#737373] tracking-wide"
                >
                  {t("profile.interests")}
                </label>
                <input
                  id="interests"
                  type="text"
                  value={formData.interests}
                  onChange={(e) =>
                    setFormData({ ...formData, interests: e.target.value })
                  }
                  placeholder={t("profile.interestsPlaceholder")}
                  className="w-full h-12 sm:h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-base sm:text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
                />
                <p className="text-[10px] sm:text-[11px] text-[#a3a3a3]">
                  {t("profile.interestsSeparatorHint")}
                </p>
              </div>
            </div>

            {/* 拡張プロフィールセクション */}
            {/* 基本情報（拡張） */}
            <div className="border-t border-[#e5e5e5]">
              <button
                type="button"
                onClick={() => setExpandedSections(prev =>
                  prev.includes("extended") ? prev.filter(s => s !== "extended") : [...prev, "extended"]
                )}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#fafaf8] transition-colors"
              >
                <span className="text-xs text-[#737373] tracking-wide">{t("profile.sectionBasicInfo")}</span>
                <span className="text-xs text-[#a3a3a3]">{expandedSections.includes("extended") ? "−" : "+"}</span>
              </button>
              {expandedSections.includes("extended") && (
                <div className="p-4 sm:p-5 pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="nickname" className="block text-xs text-[#737373]">{t("profile.nickname")}</label>
                      <input id="nickname" type="text" value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} placeholder={t("profile.nicknamePlaceholder")} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="age_range" className="block text-xs text-[#737373]">{t("profile.ageRange")}</label>
                      <select id="age_range" value={formData.age_range} onChange={(e) => setFormData({ ...formData, age_range: e.target.value })} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors">
                        <option value="">{t("profile.selectPlaceholder")}</option>
                        <option value="10s">{t("profileOptions.ageRange.10s")}</option>
                        <option value="20s">{t("profileOptions.ageRange.20s")}</option>
                        <option value="30s">{t("profileOptions.ageRange.30s")}</option>
                        <option value="40s">{t("profileOptions.ageRange.40s")}</option>
                        <option value="50plus">{t("profileOptions.ageRange.50plus")}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="gender" className="block text-xs text-[#737373]">{t("profile.gender")}</label>
                      <select id="gender" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors">
                        <option value="">{t("profile.selectPlaceholder")}</option>
                        <option value="male">{t("profileOptions.gender.male")}</option>
                        <option value="female">{t("profileOptions.gender.female")}</option>
                        <option value="other">{t("profileOptions.gender.other")}</option>
                        <option value="noAnswer">{t("profileOptions.gender.noAnswer")}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="hometown" className="block text-xs text-[#737373]">{t("profile.hometown")}</label>
                      <input id="hometown" type="text" value={formData.hometown} onChange={(e) => setFormData({ ...formData, hometown: e.target.value })} placeholder={t("profile.hometownPlaceholder")} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="nationality" className="block text-xs text-[#737373]">{t("profile.nationality")}</label>
                    <input id="nationality" type="text" value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} placeholder={t("profile.nationalityPlaceholder")} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors" />
                  </div>
                </div>
              )}
            </div>

            {/* 仕事・学歴 */}
            <div className="border-t border-[#e5e5e5]">
              <button
                type="button"
                onClick={() => setExpandedSections(prev =>
                  prev.includes("work") ? prev.filter(s => s !== "work") : [...prev, "work"]
                )}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#fafaf8] transition-colors"
              >
                <span className="text-xs text-[#737373] tracking-wide">{t("profile.sectionWork")}</span>
                <span className="text-xs text-[#a3a3a3]">{expandedSections.includes("work") ? "−" : "+"}</span>
              </button>
              {expandedSections.includes("work") && (
                <div className="p-4 sm:p-5 pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="occupation" className="block text-xs text-[#737373]">{t("profile.occupation")}</label>
                      <select id="occupation" value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors">
                        <option value="">{t("profile.selectPlaceholder")}</option>
                        <option value="employee">{t("profileOptions.occupation.employee")}</option>
                        <option value="freelance">{t("profileOptions.occupation.freelance")}</option>
                        <option value="student">{t("profileOptions.occupation.student")}</option>
                        <option value="executive">{t("profileOptions.occupation.executive")}</option>
                        <option value="other">{t("profileOptions.occupation.other")}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="work_style" className="block text-xs text-[#737373]">{t("profile.workStyle")}</label>
                      <select id="work_style" value={formData.work_style} onChange={(e) => setFormData({ ...formData, work_style: e.target.value })} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors">
                        <option value="">{t("profile.selectPlaceholder")}</option>
                        <option value="office">{t("profileOptions.workStyle.office")}</option>
                        <option value="remote">{t("profileOptions.workStyle.remote")}</option>
                        <option value="hybrid">{t("profileOptions.workStyle.hybrid")}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="industry" className="block text-xs text-[#737373]">{t("profile.industry")}</label>
                      <input id="industry" type="text" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} placeholder={t("profile.industryPlaceholder")} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="work_location" className="block text-xs text-[#737373]">{t("profile.workLocation")}</label>
                      <input id="work_location" type="text" value={formData.work_location} onChange={(e) => setFormData({ ...formData, work_location: e.target.value })} placeholder={t("profile.workLocationPlaceholder")} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ライフスタイル */}
            <div className="border-t border-[#e5e5e5]">
              <button
                type="button"
                onClick={() => setExpandedSections(prev =>
                  prev.includes("lifestyle") ? prev.filter(s => s !== "lifestyle") : [...prev, "lifestyle"]
                )}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#fafaf8] transition-colors"
              >
                <span className="text-xs text-[#737373] tracking-wide">{t("profile.sectionLifestyle")}</span>
                <span className="text-xs text-[#a3a3a3]">{expandedSections.includes("lifestyle") ? "−" : "+"}</span>
              </button>
              {expandedSections.includes("lifestyle") && (
                <div className="p-4 sm:p-5 pt-0 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="daily_rhythm" className="block text-xs text-[#737373]">{t("profile.dailyRhythm")}</label>
                      <select id="daily_rhythm" value={formData.daily_rhythm} onChange={(e) => setFormData({ ...formData, daily_rhythm: e.target.value })} className="w-full h-11 px-3 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors">
                        <option value="">{t("profile.selectPlaceholder")}</option>
                        <option value="morning">{t("profileOptions.dailyRhythm.morning")}</option>
                        <option value="night">{t("profileOptions.dailyRhythm.night")}</option>
                        <option value="irregular">{t("profileOptions.dailyRhythm.irregular")}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="alcohol" className="block text-xs text-[#737373]">{t("profile.alcohol")}</label>
                      <select id="alcohol" value={formData.alcohol} onChange={(e) => setFormData({ ...formData, alcohol: e.target.value })} className="w-full h-11 px-3 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors">
                        <option value="">{t("profile.selectPlaceholder")}</option>
                        <option value="drink">{t("profileOptions.alcohol.drink")}</option>
                        <option value="sometimes">{t("profileOptions.alcohol.sometimes")}</option>
                        <option value="noDrink">{t("profileOptions.alcohol.noDrink")}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="smoking" className="block text-xs text-[#737373]">{t("profile.smoking")}</label>
                      <select id="smoking" value={formData.smoking} onChange={(e) => setFormData({ ...formData, smoking: e.target.value })} className="w-full h-11 px-3 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors">
                        <option value="">{t("profile.selectPlaceholder")}</option>
                        <option value="smoke">{t("profileOptions.smoking.smoke")}</option>
                        <option value="noSmoke">{t("profileOptions.smoking.noSmoke")}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="home_frequency" className="block text-xs text-[#737373]">{t("profile.homeFrequency")}</label>
                      <select id="home_frequency" value={formData.home_frequency} onChange={(e) => setFormData({ ...formData, home_frequency: e.target.value })} className="w-full h-11 px-3 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors">
                        <option value="">{t("profile.selectPlaceholder")}</option>
                        <option value="everyday">{t("profileOptions.homeFrequency.everyday")}</option>
                        <option value="weekdaysOnly">{t("profileOptions.homeFrequency.weekdaysOnly")}</option>
                        <option value="weekendsOnly">{t("profileOptions.homeFrequency.weekendsOnly")}</option>
                        <option value="oftenAway">{t("profileOptions.homeFrequency.oftenAway")}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="guest_frequency" className="block text-xs text-[#737373]">{t("profile.guestFrequency")}</label>
                      <select id="guest_frequency" value={formData.guest_frequency} onChange={(e) => setFormData({ ...formData, guest_frequency: e.target.value })} className="w-full h-11 px-3 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors">
                        <option value="">{t("profile.selectPlaceholder")}</option>
                        <option value="often">{t("profileOptions.guestFrequency.often")}</option>
                        <option value="sometimes">{t("profileOptions.guestFrequency.sometimes")}</option>
                        <option value="rarely">{t("profileOptions.guestFrequency.rarely")}</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="pets" className="block text-xs text-[#737373]">{t("profile.pets")}</label>
                    <select id="pets" value={formData.pets} onChange={(e) => setFormData({ ...formData, pets: e.target.value })} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors">
                      <option value="">{t("profile.selectPlaceholder")}</option>
                      <option value="wantPets">{t("profileOptions.pets.wantPets")}</option>
                      <option value="noPets">{t("profileOptions.pets.noPets")}</option>
                      <option value="either">{t("profileOptions.pets.either")}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 共同生活への姿勢 */}
            <div className="border-t border-[#e5e5e5]">
              <button
                type="button"
                onClick={() => setExpandedSections(prev =>
                  prev.includes("communal") ? prev.filter(s => s !== "communal") : [...prev, "communal"]
                )}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#fafaf8] transition-colors"
              >
                <span className="text-xs text-[#737373] tracking-wide">{t("profile.sectionCommunal")}</span>
                <span className="text-xs text-[#a3a3a3]">{expandedSections.includes("communal") ? "−" : "+"}</span>
              </button>
              {expandedSections.includes("communal") && (
                <div className="p-4 sm:p-5 pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="social_stance" className="block text-xs text-[#737373]">{t("profile.socialStance")}</label>
                      <select id="social_stance" value={formData.social_stance} onChange={(e) => setFormData({ ...formData, social_stance: e.target.value })} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors">
                        <option value="">{t("profile.selectPlaceholder")}</option>
                        <option value="active">{t("profileOptions.socialStance.active")}</option>
                        <option value="moderate">{t("profileOptions.socialStance.moderate")}</option>
                        <option value="quiet">{t("profileOptions.socialStance.quiet")}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="cleaning_attitude" className="block text-xs text-[#737373]">{t("profile.cleaningAttitude")}</label>
                      <select id="cleaning_attitude" value={formData.cleaning_attitude} onChange={(e) => setFormData({ ...formData, cleaning_attitude: e.target.value })} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors">
                        <option value="">{t("profile.selectPlaceholder")}</option>
                        <option value="strict">{t("profileOptions.cleaningAttitude.strict")}</option>
                        <option value="moderate">{t("profileOptions.cleaningAttitude.moderate")}</option>
                        <option value="relaxed">{t("profileOptions.cleaningAttitude.relaxed")}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="cooking_frequency" className="block text-xs text-[#737373]">{t("profile.cookingFrequency")}</label>
                      <select id="cooking_frequency" value={formData.cooking_frequency} onChange={(e) => setFormData({ ...formData, cooking_frequency: e.target.value })} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors">
                        <option value="">{t("profile.selectPlaceholder")}</option>
                        <option value="daily">{t("profileOptions.cookingFrequency.daily")}</option>
                        <option value="fewTimesWeek">{t("profileOptions.cookingFrequency.fewTimesWeek")}</option>
                        <option value="sometimes">{t("profileOptions.cookingFrequency.sometimes")}</option>
                        <option value="never">{t("profileOptions.cookingFrequency.never")}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="shared_meals" className="block text-xs text-[#737373]">{t("profile.sharedMeals")}</label>
                      <select id="shared_meals" value={formData.shared_meals} onChange={(e) => setFormData({ ...formData, shared_meals: e.target.value })} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors">
                        <option value="">{t("profile.selectPlaceholder")}</option>
                        <option value="wantToJoin">{t("profileOptions.sharedMeals.wantToJoin")}</option>
                        <option value="sometimes">{t("profileOptions.sharedMeals.sometimes")}</option>
                        <option value="rarely">{t("profileOptions.sharedMeals.rarely")}</option>
                        <option value="noJoin">{t("profileOptions.sharedMeals.noJoin")}</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="shared_space_usage" className="block text-xs text-[#737373]">{t("profile.sharedSpaceUsage")}</label>
                    <input id="shared_space_usage" type="text" value={formData.shared_space_usage} onChange={(e) => setFormData({ ...formData, shared_space_usage: e.target.value })} placeholder={t("profile.sharedSpaceUsagePlaceholder")} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors" />
                  </div>
                </div>
              )}
            </div>

            {/* 性格・趣味 */}
            <div className="border-t border-[#e5e5e5]">
              <button
                type="button"
                onClick={() => setExpandedSections(prev =>
                  prev.includes("personality") ? prev.filter(s => s !== "personality") : [...prev, "personality"]
                )}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#fafaf8] transition-colors"
              >
                <span className="text-xs text-[#737373] tracking-wide">{t("profile.sectionPersonality")}</span>
                <span className="text-xs text-[#a3a3a3]">{expandedSections.includes("personality") ? "−" : "+"}</span>
              </button>
              {expandedSections.includes("personality") && (
                <div className="p-4 sm:p-5 pt-0 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="personality_type" className="block text-xs text-[#737373]">{t("profile.personalityType")}</label>
                    <input id="personality_type" type="text" value={formData.personality_type} onChange={(e) => setFormData({ ...formData, personality_type: e.target.value })} placeholder={t("profile.personalityTypePlaceholder")} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="weekend_activities" className="block text-xs text-[#737373]">{t("profile.weekendActivities")}</label>
                    <input id="weekend_activities" type="text" value={formData.weekend_activities} onChange={(e) => setFormData({ ...formData, weekend_activities: e.target.value })} placeholder={t("profile.weekendActivitiesPlaceholder")} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors" />
                  </div>
                </div>
              )}
            </div>

            {/* SNS */}
            <div className="border-t border-[#e5e5e5]">
              <button
                type="button"
                onClick={() => setExpandedSections(prev =>
                  prev.includes("sns") ? prev.filter(s => s !== "sns") : [...prev, "sns"]
                )}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#fafaf8] transition-colors"
              >
                <span className="text-xs text-[#737373] tracking-wide">{t("profile.sectionSns")}</span>
                <span className="text-xs text-[#a3a3a3]">{expandedSections.includes("sns") ? "−" : "+"}</span>
              </button>
              {expandedSections.includes("sns") && (
                <div className="p-4 sm:p-5 pt-0 space-y-4">
                  <p className="text-[10px] text-[#a3a3a3] mb-2">{t("profile.snsHint")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="sns_x" className="block text-xs text-[#737373]">{t("profile.snsX")}</label>
                      <input id="sns_x" type="text" value={formData.sns_x} onChange={(e) => setFormData({ ...formData, sns_x: e.target.value })} placeholder={t("profile.snsXPlaceholder")} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="sns_instagram" className="block text-xs text-[#737373]">{t("profile.snsInstagram")}</label>
                      <input id="sns_instagram" type="text" value={formData.sns_instagram} onChange={(e) => setFormData({ ...formData, sns_instagram: e.target.value })} placeholder={t("profile.snsInstagramPlaceholder")} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="sns_facebook" className="block text-xs text-[#737373]">{t("profile.snsFacebook")}</label>
                      <input id="sns_facebook" type="text" value={formData.sns_facebook} onChange={(e) => setFormData({ ...formData, sns_facebook: e.target.value })} placeholder={t("profile.snsFacebookPlaceholder")} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="sns_linkedin" className="block text-xs text-[#737373]">{t("profile.snsLinkedin")}</label>
                      <input id="sns_linkedin" type="text" value={formData.sns_linkedin} onChange={(e) => setFormData({ ...formData, sns_linkedin: e.target.value })} placeholder={t("profile.snsLinkedinPlaceholder")} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="sns_github" className="block text-xs text-[#737373]">{t("profile.snsGithub")}</label>
                    <input id="sns_github" type="text" value={formData.sns_github} onChange={(e) => setFormData({ ...formData, sns_github: e.target.value })} placeholder={t("profile.snsGithubPlaceholder")} className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors" />
                  </div>
                </div>
              )}
            </div>

            {/* 保存ボタン */}
            <div className="p-4 sm:p-5 border-t border-[#e5e5e5]">
              <div className="pt-3 sm:pt-2">
                <button
                  type="submit"
                  disabled={isLoading || isUploading}
                  aria-busy={isLoading}
                  aria-label={isLoading ? t("a11y.saving") : t("profile.saveChanges")}
                  className="w-full h-12 sm:h-11 bg-[#1a1a1a] text-white text-base sm:text-sm tracking-wide hover:bg-[#333] active:scale-[0.99] disabled:bg-[#a3a3a3] disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  {isLoading ? (
                    <m.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    t("profile.saveChanges")
                  )}
                </button>
              </div>
            </div>
          </form>
        </m.div>
      </div>
    </m.div>
  );
}
