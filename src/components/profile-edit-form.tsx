"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Profile, MBTI_TYPES, MBTI_LABELS, MBTIType, ROOM_NUMBERS } from "@/domain/profile";
import { updateProfile, uploadAvatar } from "@/lib/profile/actions";
import { updateTeaTimeSetting } from "@/lib/tea-time/actions";
import { updateNotificationSetting } from "@/lib/notifications/actions";
import type { NotificationKey } from "@/domain/notification";
import { getInitials } from "@/lib/utils";
import { useI18n, useLocale } from "@/hooks/use-i18n";

interface NotificationSettingsData {
  notify_tea_time: boolean;
  notify_garbage_duty: boolean;
  notify_new_photos: boolean;
}

interface ProfileEditFormProps {
  profile: Profile;
  initialTeaTimeEnabled?: boolean;
  initialNotificationSettings?: NotificationSettingsData;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-8 pb-4">
      <span className="text-[11px] tracking-wider text-[#a3a3a3] whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 border-b border-[#e5e5e5]" />
    </div>
  );
}

function InputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date";
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs text-[#737373] tracking-wide">
        {label}
        {required && <span className="text-[#c9a0a0] ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full h-11 px-4 bg-white border border-[#e5e5e5] rounded-md text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs text-[#737373] tracking-wide">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-4 bg-white border border-[#e5e5e5] rounded-md text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs text-[#737373] tracking-wide">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-md text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors resize-none leading-relaxed"
      />
      {hint && <p className="text-[10px] text-[#a3a3a3]">{hint}</p>}
    </div>
  );
}

export function ProfileEditForm({
  profile,
  initialTeaTimeEnabled = false,
  initialNotificationSettings,
}: ProfileEditFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useI18n();
  const locale = useLocale();

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTeaTimeLoading, setIsTeaTimeLoading] = useState(false);
  const [teaTimeEnabled, setTeaTimeEnabled] = useState(initialTeaTimeEnabled);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsData>({
    notify_tea_time: initialNotificationSettings?.notify_tea_time ?? true,
    notify_garbage_duty: initialNotificationSettings?.notify_garbage_duty ?? true,
    notify_new_photos: initialNotificationSettings?.notify_new_photos ?? true,
  });
  const [notificationLoading, setNotificationLoading] = useState<NotificationKey | null>(null);
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
    nickname: profile.nickname || "",
    age_range: profile.age_range || "",
    gender: profile.gender || "",
    nationality: profile.nationality || "",
    languages: profile.languages || [],
    hometown: profile.hometown || "",
    occupation: profile.occupation || "",
    industry: profile.industry || "",
    work_location: profile.work_location || "",
    work_style: profile.work_style || "",
    daily_rhythm: profile.daily_rhythm || "",
    home_frequency: profile.home_frequency || "",
    alcohol: profile.alcohol || "",
    smoking: profile.smoking || "",
    pets: profile.pets || "",
    guest_frequency: profile.guest_frequency || "",
    social_stance: profile.social_stance || "",
    shared_space_usage: profile.shared_space_usage || "",
    cleaning_attitude: profile.cleaning_attitude || "",
    cooking_frequency: profile.cooking_frequency || "",
    shared_meals: profile.shared_meals || "",
    allergies: profile.allergies || "",
    personality_type: profile.personality_type || "",
    weekend_activities: profile.weekend_activities || "",
    sns_x: profile.sns_x || "",
    sns_instagram: profile.sns_instagram || "",
    sns_facebook: profile.sns_facebook || "",
    sns_linkedin: profile.sns_linkedin || "",
    sns_github: profile.sns_github || "",
    sns_line: profile.sns_line || "",
  });

  const interestsArray = useMemo(
    () =>
      formData.interests
        .split(/[,、・]/)
        .map((i) => i.trim())
        .filter((i) => i.length > 0),
    [formData.interests]
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
      nickname: formData.nickname.trim() || null,
      age_range: formData.age_range || null,
      gender: formData.gender || null,
      nationality: formData.nationality.trim() || null,
      languages: formData.languages,
      hometown: formData.hometown.trim() || null,
      occupation: formData.occupation || null,
      industry: formData.industry.trim() || null,
      work_location: formData.work_location.trim() || null,
      work_style: formData.work_style || null,
      daily_rhythm: formData.daily_rhythm || null,
      home_frequency: formData.home_frequency || null,
      alcohol: formData.alcohol || null,
      smoking: formData.smoking || null,
      pets: formData.pets || null,
      guest_frequency: formData.guest_frequency || null,
      social_stance: formData.social_stance || null,
      shared_space_usage: formData.shared_space_usage.trim() || null,
      cleaning_attitude: formData.cleaning_attitude || null,
      cooking_frequency: formData.cooking_frequency || null,
      shared_meals: formData.shared_meals || null,
      allergies: formData.allergies.trim() || null,
      personality_type: formData.personality_type.trim() || null,
      weekend_activities: formData.weekend_activities.trim() || null,
      sns_x: formData.sns_x.trim() || null,
      sns_instagram: formData.sns_instagram.trim() || null,
      sns_facebook: formData.sns_facebook.trim() || null,
      sns_linkedin: formData.sns_linkedin.trim() || null,
      sns_github: formData.sns_github.trim() || null,
      sns_line: formData.sns_line.trim() || null,
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

  const handleNotificationToggle = async (key: NotificationKey, checked: boolean) => {
    setNotificationLoading(key);
    setNotificationSettings((prev) => ({ ...prev, [key]: checked }));

    const result = await updateNotificationSetting(key, checked);

    if ("error" in result) {
      setNotificationSettings((prev) => ({ ...prev, [key]: !checked }));
    }

    setNotificationLoading(null);
  };

  const updateField = useCallback((field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
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
            className="mb-6 py-3 px-4 bg-[#faf8f8] border-l-2 border-[#c9a0a0]"
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
            className="mb-6 py-3 px-4 bg-[#f8faf8] border-l-2 border-[#a0c9a0]"
          >
            <p className="text-sm text-[#6b8b6b]">{t("profile.saved")}</p>
          </m.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        {/* Hero: Avatar + Core Identity */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start">
          <div className="shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="relative w-36 h-36 sm:w-44 sm:h-44 h-auto p-0 bg-[#f5f5f3] group block overflow-hidden hover:bg-[#f5f5f3] rounded-full"
            >
              <Avatar className="absolute inset-0 size-full rounded-full">
                <OptimizedAvatarImage
                  src={avatarUrl}
                  context="edit"
                  alt={t("a11y.profilePhotoAlt", { name: formData.name || "?" })}
                  fallback={getInitials(formData.name || "?")}
                  fallbackClassName="bg-[#f5f5f3] text-[#a3a3a3] text-4xl rounded-full"
                />
              </Avatar>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs tracking-wide">
                  {isUploading ? t("profile.uploadingPhoto") : t("profile.changePhoto")}
                </span>
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-[10px] text-[#a3a3a3] text-center mt-2">
              {t("profile.photoFormat")}
            </p>
          </div>

          <div className="flex-1 w-full space-y-4">
            <InputField
              id="name"
              label={t("auth.name")}
              value={formData.name}
              onChange={(v) => updateField("name", v)}
              placeholder={t("auth.namePlaceholder")}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                id="room_number"
                label={t("profile.roomNumber")}
                value={formData.room_number}
                onChange={(v) => updateField("room_number", v)}
                options={ROOM_NUMBERS.map((r) => ({ value: r, label: r }))}
                placeholder={t("profile.selectPlaceholder")}
              />
              <InputField
                id="move_in_date"
                label={t("profile.moveInDate")}
                value={formData.move_in_date}
                onChange={(v) => updateField("move_in_date", v)}
                type="date"
              />
            </div>
          </div>
        </div>

        {/* Bio, Interests, MBTI */}
        <div className="space-y-4 mt-6">
          <TextareaField
            id="bio"
            label={t("profile.bio")}
            value={formData.bio}
            onChange={(v) => updateField("bio", v)}
            placeholder={t("profile.bioPlaceholder")}
          />
          <InputField
            id="interests"
            label={t("profile.interests")}
            value={formData.interests}
            onChange={(v) => updateField("interests", v)}
            placeholder={t("profile.interestsPlaceholder")}
          />
          {interestsArray.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {interestsArray.map((interest, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 bg-[#f5f5f3] text-[#737373] rounded">
                  {interest}
                </span>
              ))}
            </div>
          )}
          <SelectField
            id="mbti"
            label={t("profile.mbti")}
            value={formData.mbti}
            onChange={(v) => updateField("mbti", v)}
            options={MBTI_TYPES.map((type) => ({
              value: type,
              label: `${type} - ${MBTI_LABELS[type][locale === "ja" ? "ja" : "en"]}`,
            }))}
            placeholder={t("profile.mbtiPlaceholder")}
          />
        </div>

        {/* About You */}
        <SectionLabel label={t("profile.sectionBasicInfo")} />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="nickname"
              label={t("profile.nickname")}
              value={formData.nickname}
              onChange={(v) => updateField("nickname", v)}
              placeholder={t("profile.nicknamePlaceholder")}
            />
            <SelectField
              id="age_range"
              label={t("profile.ageRange")}
              value={formData.age_range}
              onChange={(v) => updateField("age_range", v)}
              options={[
                { value: "10s", label: t("profileOptions.ageRange.10s") },
                { value: "20s", label: t("profileOptions.ageRange.20s") },
                { value: "30s", label: t("profileOptions.ageRange.30s") },
                { value: "40s", label: t("profileOptions.ageRange.40s") },
                { value: "50plus", label: t("profileOptions.ageRange.50plus") },
              ]}
              placeholder={t("profile.selectPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              id="gender"
              label={t("profile.gender")}
              value={formData.gender}
              onChange={(v) => updateField("gender", v)}
              options={[
                { value: "male", label: t("profileOptions.gender.male") },
                { value: "female", label: t("profileOptions.gender.female") },
                { value: "other", label: t("profileOptions.gender.other") },
                { value: "noAnswer", label: t("profileOptions.gender.noAnswer") },
              ]}
              placeholder={t("profile.selectPlaceholder")}
            />
            <InputField
              id="hometown"
              label={t("profile.hometown")}
              value={formData.hometown}
              onChange={(v) => updateField("hometown", v)}
              placeholder={t("profile.hometownPlaceholder")}
            />
          </div>
          <InputField
            id="nationality"
            label={t("profile.nationality")}
            value={formData.nationality}
            onChange={(v) => updateField("nationality", v)}
            placeholder={t("profile.nationalityPlaceholder")}
          />
        </div>

        {/* Work */}
        <SectionLabel label={t("profile.sectionWork")} />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              id="occupation"
              label={t("profile.occupation")}
              value={formData.occupation}
              onChange={(v) => updateField("occupation", v)}
              options={[
                { value: "employee", label: t("profileOptions.occupation.employee") },
                { value: "freelance", label: t("profileOptions.occupation.freelance") },
                { value: "student", label: t("profileOptions.occupation.student") },
                { value: "executive", label: t("profileOptions.occupation.executive") },
                { value: "other", label: t("profileOptions.occupation.other") },
              ]}
              placeholder={t("profile.selectPlaceholder")}
            />
            <SelectField
              id="work_style"
              label={t("profile.workStyle")}
              value={formData.work_style}
              onChange={(v) => updateField("work_style", v)}
              options={[
                { value: "office", label: t("profileOptions.workStyle.office") },
                { value: "remote", label: t("profileOptions.workStyle.remote") },
                { value: "hybrid", label: t("profileOptions.workStyle.hybrid") },
              ]}
              placeholder={t("profile.selectPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="industry"
              label={t("profile.industry")}
              value={formData.industry}
              onChange={(v) => updateField("industry", v)}
              placeholder={t("profile.industryPlaceholder")}
            />
            <InputField
              id="work_location"
              label={t("profile.workLocation")}
              value={formData.work_location}
              onChange={(v) => updateField("work_location", v)}
              placeholder={t("profile.workLocationPlaceholder")}
            />
          </div>
        </div>

        {/* Lifestyle */}
        <SectionLabel label={t("profile.sectionLifestyle")} />
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <SelectField
              id="daily_rhythm"
              label={t("profile.dailyRhythm")}
              value={formData.daily_rhythm}
              onChange={(v) => updateField("daily_rhythm", v)}
              options={[
                { value: "morning", label: t("profileOptions.dailyRhythm.morning") },
                { value: "night", label: t("profileOptions.dailyRhythm.night") },
                { value: "irregular", label: t("profileOptions.dailyRhythm.irregular") },
              ]}
              placeholder={t("profile.selectPlaceholder")}
            />
            <SelectField
              id="alcohol"
              label={t("profile.alcohol")}
              value={formData.alcohol}
              onChange={(v) => updateField("alcohol", v)}
              options={[
                { value: "drink", label: t("profileOptions.alcohol.drink") },
                { value: "sometimes", label: t("profileOptions.alcohol.sometimes") },
                { value: "noDrink", label: t("profileOptions.alcohol.noDrink") },
              ]}
              placeholder={t("profile.selectPlaceholder")}
            />
            <SelectField
              id="smoking"
              label={t("profile.smoking")}
              value={formData.smoking}
              onChange={(v) => updateField("smoking", v)}
              options={[
                { value: "smoke", label: t("profileOptions.smoking.smoke") },
                { value: "noSmoke", label: t("profileOptions.smoking.noSmoke") },
              ]}
              placeholder={t("profile.selectPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              id="home_frequency"
              label={t("profile.homeFrequency")}
              value={formData.home_frequency}
              onChange={(v) => updateField("home_frequency", v)}
              options={[
                { value: "everyday", label: t("profileOptions.homeFrequency.everyday") },
                { value: "weekdaysOnly", label: t("profileOptions.homeFrequency.weekdaysOnly") },
                { value: "weekendsOnly", label: t("profileOptions.homeFrequency.weekendsOnly") },
                { value: "oftenAway", label: t("profileOptions.homeFrequency.oftenAway") },
              ]}
              placeholder={t("profile.selectPlaceholder")}
            />
            <SelectField
              id="guest_frequency"
              label={t("profile.guestFrequency")}
              value={formData.guest_frequency}
              onChange={(v) => updateField("guest_frequency", v)}
              options={[
                { value: "often", label: t("profileOptions.guestFrequency.often") },
                { value: "sometimes", label: t("profileOptions.guestFrequency.sometimes") },
                { value: "rarely", label: t("profileOptions.guestFrequency.rarely") },
              ]}
              placeholder={t("profile.selectPlaceholder")}
            />
          </div>
          <SelectField
            id="pets"
            label={t("profile.pets")}
            value={formData.pets}
            onChange={(v) => updateField("pets", v)}
            options={[
              { value: "wantPets", label: t("profileOptions.pets.wantPets") },
              { value: "noPets", label: t("profileOptions.pets.noPets") },
              { value: "either", label: t("profileOptions.pets.either") },
            ]}
            placeholder={t("profile.selectPlaceholder")}
          />
        </div>

        {/* Communal */}
        <SectionLabel label={t("profile.sectionCommunal")} />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              id="social_stance"
              label={t("profile.socialStance")}
              value={formData.social_stance}
              onChange={(v) => updateField("social_stance", v)}
              options={[
                { value: "active", label: t("profileOptions.socialStance.active") },
                { value: "moderate", label: t("profileOptions.socialStance.moderate") },
                { value: "quiet", label: t("profileOptions.socialStance.quiet") },
              ]}
              placeholder={t("profile.selectPlaceholder")}
            />
            <SelectField
              id="cleaning_attitude"
              label={t("profile.cleaningAttitude")}
              value={formData.cleaning_attitude}
              onChange={(v) => updateField("cleaning_attitude", v)}
              options={[
                { value: "strict", label: t("profileOptions.cleaningAttitude.strict") },
                { value: "moderate", label: t("profileOptions.cleaningAttitude.moderate") },
                { value: "relaxed", label: t("profileOptions.cleaningAttitude.relaxed") },
              ]}
              placeholder={t("profile.selectPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              id="cooking_frequency"
              label={t("profile.cookingFrequency")}
              value={formData.cooking_frequency}
              onChange={(v) => updateField("cooking_frequency", v)}
              options={[
                { value: "daily", label: t("profileOptions.cookingFrequency.daily") },
                { value: "fewTimesWeek", label: t("profileOptions.cookingFrequency.fewTimesWeek") },
                { value: "sometimes", label: t("profileOptions.cookingFrequency.sometimes") },
                { value: "never", label: t("profileOptions.cookingFrequency.never") },
              ]}
              placeholder={t("profile.selectPlaceholder")}
            />
            <SelectField
              id="shared_meals"
              label={t("profile.sharedMeals")}
              value={formData.shared_meals}
              onChange={(v) => updateField("shared_meals", v)}
              options={[
                { value: "wantToJoin", label: t("profileOptions.sharedMeals.wantToJoin") },
                { value: "sometimes", label: t("profileOptions.sharedMeals.sometimes") },
                { value: "rarely", label: t("profileOptions.sharedMeals.rarely") },
                { value: "noJoin", label: t("profileOptions.sharedMeals.noJoin") },
              ]}
              placeholder={t("profile.selectPlaceholder")}
            />
          </div>
          <InputField
            id="shared_space_usage"
            label={t("profile.sharedSpaceUsage")}
            value={formData.shared_space_usage}
            onChange={(v) => updateField("shared_space_usage", v)}
            placeholder={t("profile.sharedSpaceUsagePlaceholder")}
          />
          <InputField
            id="allergies"
            label={t("profile.allergies")}
            value={formData.allergies}
            onChange={(v) => updateField("allergies", v)}
            placeholder={t("profile.allergiesPlaceholder")}
          />
        </div>

        {/* Personality */}
        <SectionLabel label={t("profile.sectionPersonality")} />
        <div className="space-y-4">
          <InputField
            id="personality_type"
            label={t("profile.personalityType")}
            value={formData.personality_type}
            onChange={(v) => updateField("personality_type", v)}
            placeholder={t("profile.personalityTypePlaceholder")}
          />
          <InputField
            id="weekend_activities"
            label={t("profile.weekendActivities")}
            value={formData.weekend_activities}
            onChange={(v) => updateField("weekend_activities", v)}
            placeholder={t("profile.weekendActivitiesPlaceholder")}
          />
        </div>

        {/* SNS */}
        <SectionLabel label={t("profile.sectionSns")} />
        <div className="space-y-4">
          <p className="text-[10px] text-[#a3a3a3]">{t("profile.snsHint")}</p>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="sns_x"
              label={t("profile.snsX")}
              value={formData.sns_x}
              onChange={(v) => updateField("sns_x", v)}
              placeholder={t("profile.snsXPlaceholder")}
            />
            <InputField
              id="sns_instagram"
              label={t("profile.snsInstagram")}
              value={formData.sns_instagram}
              onChange={(v) => updateField("sns_instagram", v)}
              placeholder={t("profile.snsInstagramPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="sns_facebook"
              label={t("profile.snsFacebook")}
              value={formData.sns_facebook}
              onChange={(v) => updateField("sns_facebook", v)}
              placeholder={t("profile.snsFacebookPlaceholder")}
            />
            <InputField
              id="sns_linkedin"
              label={t("profile.snsLinkedin")}
              value={formData.sns_linkedin}
              onChange={(v) => updateField("sns_linkedin", v)}
              placeholder={t("profile.snsLinkedinPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="sns_github"
              label={t("profile.snsGithub")}
              value={formData.sns_github}
              onChange={(v) => updateField("sns_github", v)}
              placeholder={t("profile.snsGithubPlaceholder")}
            />
            <InputField
              id="sns_line"
              label={t("profile.snsLine")}
              value={formData.sns_line}
              onChange={(v) => updateField("sns_line", v)}
              placeholder={t("profile.snsLinePlaceholder")}
            />
          </div>
        </div>

        {/* Tea Time & Notifications */}
        <SectionLabel label={`${t("teaTime.title")} & ${t("notifications.sectionTitle")}`} />
        <div className="divide-y divide-[#f5f5f3]">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-xs tracking-wide text-[#737373]">{t("teaTime.title")}</p>
              <p className="text-[10px] text-[#a3a3a3]">
                {teaTimeEnabled ? t("teaTime.participating") : t("teaTime.notParticipating")}
              </p>
            </div>
            {isTeaTimeLoading ? (
              <m.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block w-5 h-5 border border-[#d4d4d4] border-t-[#1a1a1a] rounded-full shrink-0"
              />
            ) : (
              <Switch
                checked={teaTimeEnabled}
                onCheckedChange={handleTeaTimeToggle}
                disabled={isTeaTimeLoading}
                className="shrink-0"
              />
            )}
          </div>
          {([
            { key: "notify_tea_time" as NotificationKey, label: t("notifications.teaTime"), description: t("notifications.teaTimeDescription") },
            { key: "notify_garbage_duty" as NotificationKey, label: t("notifications.garbageDuty"), description: t("notifications.garbageDutyDescription") },
            { key: "notify_new_photos" as NotificationKey, label: t("notifications.newPhotos"), description: t("notifications.newPhotosDescription") },
          ]).map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3">
              <div>
                <p className="text-xs tracking-wide text-[#737373]">{item.label}</p>
                <p className="text-[10px] text-[#a3a3a3]">{item.description}</p>
              </div>
              {notificationLoading === item.key ? (
                <m.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-5 h-5 border border-[#d4d4d4] border-t-[#1a1a1a] rounded-full shrink-0"
                />
              ) : (
                <Switch
                  checked={notificationSettings[item.key]}
                  onCheckedChange={(checked) => handleNotificationToggle(item.key, checked)}
                  disabled={notificationLoading === item.key}
                  className="shrink-0"
                />
              )}
            </div>
          ))}
        </div>

        {/* Save Button - sticky on mobile, normal flow on desktop */}
        <div className="sticky bottom-20 sm:static z-[30] mt-8 pt-4 pb-2 sm:pb-0 bg-[#fafaf8] sm:bg-transparent border-t border-[#e5e5e5] sm:border-t-0">
          <Button
            type="submit"
            size="xl"
            disabled={isLoading || isUploading}
            aria-busy={isLoading}
            aria-label={isLoading ? t("a11y.saving") : t("profile.saveChanges")}
            className="w-full active:scale-[0.99]"
          >
            {isLoading ? (
              <Spinner variant="light" className="border-2" />
            ) : (
              t("profile.saveChanges")
            )}
          </Button>
        </div>
      </form>
    </m.div>
  );
}
