"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Profile, MBTI_TYPES, MBTIType } from "@/domain/profile";
import { updateProfile, uploadAvatar } from "@/lib/profile/actions";
import { updateTeaTimeSetting } from "@/lib/tea-time/actions";
import { getInitials } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";

interface ProfileEditFormProps {
  profile: Profile;
  initialTeaTimeEnabled?: boolean;
}

export function ProfileEditForm({ profile, initialTeaTimeEnabled = false }: ProfileEditFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useI18n();

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
  });

  // プロフィール完成度を計算
  const completionItems = [
    { label: t("profile.completionItems.photo"), completed: !!avatarUrl },
    { label: t("profile.completionItems.name"), completed: !!formData.name.trim() },
    {
      label: t("profile.completionItems.roomNumber"),
      completed: !!formData.room_number.trim(),
    },
    { label: t("profile.completionItems.bio"), completed: !!formData.bio.trim() },
    { label: t("profile.completionItems.interests"), completed: !!formData.interests.trim() },
  ];
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError(t("auth.nameRequired"));
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    const interests = formData.interests
      .split(/[,、・]/)
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const result = await updateProfile({
      name: formData.name.trim(),
      room_number: formData.room_number.trim() || null,
      bio: formData.bio.trim() || null,
      interests,
      mbti: formData.mbti || null,
      move_in_date: formData.move_in_date || null,
    });

    setIsLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const interestsArray = formData.interests
    .split(/[,、・]/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0);

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
    <motion.div
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
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="py-3 px-4 bg-[#faf8f8] border-l-2 border-[#c9a0a0]"
          >
            <p className="text-sm text-[#8b6b6b]">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="py-3 px-4 bg-[#f8faf8] border-l-2 border-[#a0c9a0]"
          >
            <p className="text-sm text-[#6b8b6b]">{t("profile.saved")}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-5 md:grid-cols-5">
        {/* 左：プレビュー */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="md:col-span-2 space-y-4"
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
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploading}
                className="relative w-full aspect-square bg-[#f5f5f3] group mb-4"
              >
                <Avatar className="w-full h-full rounded-none">
                  <AvatarImage
                    src={avatarUrl || undefined}
                    className="object-cover"
                    alt={t("a11y.profilePhotoAlt", { name: formData.name || "?" })}
                  />
                  <AvatarFallback className="bg-[#f5f5f3] text-[#a3a3a3] text-4xl rounded-none">
                    {getInitials(formData.name || "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs tracking-wide">
                    {isUploading ? t("profile.uploadingPhoto") : t("profile.changePhoto")}
                  </span>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <motion.span
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
              <motion.div
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
          <motion.div
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
                    <motion.div
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
                    </motion.div>
                    <p className={`text-sm sm:text-xs tracking-wide transition-colors ${
                      teaTimeEnabled ? "text-[#6b8b6b] font-medium" : "text-[#737373]"
                    }`}>
                      {t("profile.teaTimeStatus")}
                    </p>
                  </div>

                  <motion.p
                    animate={{
                      color: teaTimeEnabled ? "#6b8b6b" : "#a3a3a3",
                    }}
                    transition={{ duration: 0.3 }}
                    className="text-xs sm:text-[10px] leading-relaxed"
                  >
                    {teaTimeEnabled
                      ? t("teaTime.participating")
                      : t("teaTime.notParticipating")}
                  </motion.p>

                  {teaTimeEnabled && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                      className="text-[10px] text-[#8ba88b] mt-2"
                    >
                      {t("teaTime.matchingTarget")}
                    </motion.p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <AnimatePresence mode="wait">
                    {isTeaTimeLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="inline-block w-5 h-5 border border-[#d4d4d4] border-t-[#1a1a1a] rounded-full"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </button>
          </motion.div>

          {/* 写真アップロードのヒント */}
        <p className="text-[10px] text-[#a3a3a3] text-center">
          {t("profile.photoHintMobile")}
          <br className="sm:hidden" />
          <span className="hidden sm:inline">・</span>
          {t("profile.photoFormat")}
        </p>
        </motion.div>

        {/* 右：編集フォーム */}
        <motion.div
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
                      {type}
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

              {/* 保存ボタン */}
              <div className="pt-3 sm:pt-2">
                <button
                  type="submit"
                  disabled={isLoading || isUploading}
                  className="w-full h-12 sm:h-11 bg-[#1a1a1a] text-white text-base sm:text-sm tracking-wide hover:bg-[#333] active:scale-[0.99] disabled:bg-[#a3a3a3] disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  {isLoading ? (
                    <motion.span
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
        </motion.div>
      </div>
    </motion.div>
  );
}
