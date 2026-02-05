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
import { prepareImageForUpload } from "@/lib/utils/image-compression";
import { FILE_UPLOAD } from "@/lib/constants/config";
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
  targetUserId?: string;
}

function SectionLabel({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 pt-12 pb-6">
      <div className="flex items-center gap-2">
        {icon && <span className="text-brand-500">{icon}</span>}
        <h3 className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase whitespace-nowrap">
          {label}
        </h3>
      </div>
      <div className="flex-1 h-px bg-slate-100" />
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
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date";
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-2.5">
      <label htmlFor={id} className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full h-12 px-5 bg-white border border-slate-200 rounded-2xl text-slate-700 text-[15px] font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all duration-300"
      />
      {hint && <p className="text-[10px] text-slate-400 font-medium ml-1">{hint}</p>}
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
    <div className="space-y-2.5">
      <label htmlFor={id} className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
        {label}
      </label>
      <div className="relative group">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 pl-5 pr-10 bg-white border border-slate-200 rounded-2xl text-slate-700 text-[15px] font-medium focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all duration-300 appearance-none"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-slate-400 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
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
    <div className="space-y-2.5">
      <label htmlFor={id} className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-3xl text-slate-700 text-[15px] font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all duration-300 resize-none leading-relaxed"
      />
      {hint && <p className="text-[10px] text-slate-400 font-medium ml-1">{hint}</p>}
    </div>
  );
}

export function ProfileEditForm({
  profile,
  initialTeaTimeEnabled = false,
  initialNotificationSettings,
  targetUserId,
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
    room_number: profile.room_number ?? "",
    bio: profile.bio ?? "",
    interests: profile.interests?.join(", ") ?? "",
    mbti: profile.mbti ?? ("" as MBTIType | ""),
    move_in_date: profile.move_in_date ?? "",
    nickname: profile.nickname ?? "",
    age_range: profile.age_range ?? "",
    gender: profile.gender ?? "",
    nationality: profile.nationality ?? "",
    languages: profile.languages ?? [],
    hometown: profile.hometown ?? "",
    occupation: profile.occupation ?? "",
    industry: profile.industry ?? "",
    work_location: profile.work_location ?? "",
    work_style: profile.work_style ?? "",
    daily_rhythm: profile.daily_rhythm ?? "",
    home_frequency: profile.home_frequency ?? "",
    alcohol: profile.alcohol ?? "",
    smoking: profile.smoking ?? "",
    pets: profile.pets ?? "",
    guest_frequency: profile.guest_frequency ?? "",
    social_stance: profile.social_stance ?? "",
    shared_space_usage: profile.shared_space_usage ?? "",
    cleaning_attitude: profile.cleaning_attitude ?? "",
    cooking_frequency: profile.cooking_frequency ?? "",
    shared_meals: profile.shared_meals ?? "",
    allergies: profile.allergies ?? "",
    personality_type: profile.personality_type ?? "",
    weekend_activities: profile.weekend_activities ?? "",
    sns_x: profile.sns_x ?? "",
    sns_instagram: profile.sns_instagram ?? "",
    sns_facebook: profile.sns_facebook ?? "",
    sns_linkedin: profile.sns_linkedin ?? "",
    sns_github: profile.sns_github ?? "",
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

    try {
      const prepared = await prepareImageForUpload(file);
      const formDataUpload = new FormData();
      formDataUpload.append("avatar", prepared.file);
      if (targetUserId) {
        formDataUpload.append("targetUserId", targetUserId);
      }

      const result = await uploadAvatar(formDataUpload);

      if ("error" in result) {
        setError(result.error);
      } else if ("url" in result) {
        setAvatarUrl(result.url);
      }
    } catch {
      setError(t("errors.compressionFailed"));
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
    }, targetUserId);

    setIsLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }, [formData, interestsArray, t, targetUserId]);

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
            className="mb-6 py-3 px-4 bg-error-bg border-l-2 border-error-border"
          >
            <p className="text-sm text-error">{error}</p>
          </m.div>
        )}
        {success && (
          <m.div
            key="success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mb-6 py-3 px-4 bg-success-bg border-l-2 border-success-border"
          >
            <p className="text-sm text-success">{t("profile.saved")}</p>
          </m.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Hero: Avatar + Core Identity */}
        <div className="premium-surface rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-slate-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50/30 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-50/50 rounded-full blur-3xl -ml-24 -mb-24" />

          <div className="relative flex flex-col sm:flex-row gap-8 sm:gap-12 items-center sm:items-start">
            <div className="shrink-0 group">
              <div className="relative w-40 h-40 sm:w-48 sm:h-48">
                <div className="absolute inset-0 rounded-full bg-brand-100/50 animate-pulse group-hover:animate-none group-hover:scale-105 transition-transform duration-500" />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  className="relative w-full h-full p-1 bg-white border-2 border-slate-50 rounded-full overflow-hidden shadow-md group-hover:shadow-xl group-hover:border-brand-100 transition-all duration-500"
                >
                  <Avatar className="size-full rounded-full">
                    <OptimizedAvatarImage
                      src={avatarUrl}
                      context="edit"
                      alt={t("a11y.profilePhotoAlt", { name: formData.name || "?" })}
                      fallback={getInitials(formData.name || "?")}
                      fallbackClassName="bg-slate-50 text-slate-300 text-5xl rounded-full"
                    />
                  </Avatar>

                  <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-2">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 011.664.89l.812 1.22A2 2 0 0010.07 10H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-white text-[10px] font-bold tracking-widest uppercase">
                      {isUploading ? t("profile.uploadingPhoto") : t("profile.changePhoto")}
                    </span>
                  </div>

                  {isUploading && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                      <Spinner size="lg" variant="dark" />
                    </div>
                  )}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={FILE_UPLOAD.inputAccept}
                onChange={handleAvatarChange}
                className="hidden"
                aria-label={t("profile.changePhoto")}
              />
              <p className="text-[10px] text-slate-300 font-bold tracking-widest uppercase text-center mt-4">
                {t("profile.photoFormat")}
              </p>
            </div>

            <div className="flex-1 w-full space-y-8 py-2">
              <div className="space-y-6">
                <InputField
                  id="name"
                  label={t("auth.name")}
                  value={formData.name}
                  onChange={(v) => updateField("name", v)}
                  placeholder={t("auth.namePlaceholder")}
                  required
                />

                <div className="grid grid-cols-2 gap-6">
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
          </div>
        </div>

        {/* Bio, Interests, MBTI */}
        <div className="premium-surface rounded-[2rem] p-8 sm:p-10 shadow-sm border border-slate-50 space-y-8">
          <SectionLabel
            label={t("profile.bio")}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
          />
          <TextareaField
            id="bio"
            label={t("profile.bio")}
            value={formData.bio}
            onChange={(v) => updateField("bio", v)}
            placeholder={t("profile.bioPlaceholder")}
            rows={4}
          />
          <div className="space-y-4">
            <InputField
              id="interests"
              label={t("profile.interests")}
              value={formData.interests}
              onChange={(v) => updateField("interests", v)}
              placeholder={t("profile.interestsPlaceholder")}
              hint={t("profile.interestsHint")}
            />
            {interestsArray.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1">
                {interestsArray.map((interest, i) => (
                  <span key={i} className="text-[10px] font-bold tracking-wider px-3 py-1 bg-brand-50 text-brand-500 rounded-full border border-brand-100/50 uppercase">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
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
        <div className="premium-surface rounded-[2rem] p-8 sm:p-10 shadow-sm border border-slate-50 space-y-8">
          <SectionLabel
            label={t("profile.sectionBasicInfo")}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            <div className="sm:col-span-2">
              <InputField
                id="nationality"
                label={t("profile.nationality")}
                value={formData.nationality}
                onChange={(v) => updateField("nationality", v)}
                placeholder={t("profile.nationalityPlaceholder")}
              />
            </div>
          </div>
        </div>

        {/* Work */}
        <div className="premium-surface rounded-[2rem] p-8 sm:p-10 shadow-sm border border-slate-50 space-y-8">
          <SectionLabel
            label={t("profile.sectionWork")}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
        <div className="premium-surface rounded-[2rem] p-8 sm:p-10 shadow-sm border border-slate-50 space-y-8">
          <SectionLabel
            label={t("profile.sectionLifestyle")}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            <div className="sm:col-span-2">
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
          </div>
        </div>

        {/* Communal */}
        <div className="premium-surface rounded-[2rem] p-8 sm:p-10 shadow-sm border border-slate-50 space-y-8">
          <SectionLabel
            label={t("profile.sectionCommunal")}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            <div className="sm:col-span-2 space-y-6">
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
          </div>
        </div>

        {/* Personality */}
        <div className="premium-surface rounded-[2rem] p-8 sm:p-10 shadow-sm border border-slate-50 space-y-8">
          <SectionLabel
            label={t("profile.sectionPersonality")}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <div className="space-y-6">
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
        </div>

        {/* SNS */}
        <div className="premium-surface rounded-[2rem] p-8 sm:p-10 shadow-sm border border-slate-50 space-y-8">
          <SectionLabel
            label={t("profile.sectionSns")}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
          />
          <div className="space-y-6">
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase ml-1 opacity-70">
              {t("profile.snsHint")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
              <InputField
                id="sns_github"
                label={t("profile.snsGithub")}
                value={formData.sns_github}
                onChange={(v) => updateField("sns_github", v)}
                placeholder={t("profile.snsGithubPlaceholder")}
              />
            </div>
          </div>
        </div>

        {/* Tea Time & Notifications */}
        <div className="premium-surface rounded-[2rem] p-8 sm:p-10 shadow-sm border border-slate-50 space-y-8">
          <SectionLabel
            label={`${t("teaTime.title")} & ${t("notifications.sectionTitle")}`}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
          />
          <div className="divide-y divide-slate-50">
            <div className="flex items-center justify-between py-5 group first:pt-0">
              <div className="space-y-1">
                <p className="text-[13px] font-bold text-slate-600 tracking-wide">{t("teaTime.title")}</p>
                <p className={`text-[11px] font-medium ${teaTimeEnabled ? "text-brand-500" : "text-slate-400"}`}>
                  {teaTimeEnabled ? t("teaTime.participating") : t("teaTime.notParticipating")}
                </p>
              </div>
              {isTeaTimeLoading ? (
                <Spinner size="sm" variant="dark" />
              ) : (
                <Switch
                  checked={teaTimeEnabled}
                  onCheckedChange={handleTeaTimeToggle}
                  disabled={isTeaTimeLoading}
                  className="scale-110 data-[state=checked]:bg-brand-500"
                />
              )}
            </div>
            {([
              { key: "notify_tea_time" as NotificationKey, label: t("notifications.teaTime"), description: t("notifications.teaTimeDescription") },
              { key: "notify_garbage_duty" as NotificationKey, label: t("notifications.garbageDuty"), description: t("notifications.garbageDutyDescription") },
              { key: "notify_new_photos" as NotificationKey, label: t("notifications.newPhotos"), description: t("notifications.newPhotosDescription") },
            ]).map((item) => (
              <div key={item.key} className="flex items-center justify-between py-5 group">
                <div className="space-y-1">
                  <p className="text-[13px] font-bold text-slate-600 tracking-wide">{item.label}</p>
                  <p className="text-[11px] font-medium text-slate-400">{item.description}</p>
                </div>
                {notificationLoading === item.key ? (
                  <Spinner size="sm" variant="dark" />
                ) : (
                  <Switch
                    checked={notificationSettings[item.key]}
                    onCheckedChange={(checked) => handleNotificationToggle(item.key, checked)}
                    disabled={notificationLoading === item.key}
                    className="scale-110 data-[state=checked]:bg-brand-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <m.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky bottom-6 sm:bottom-10 z-30"
        >
          <div className="premium-surface glass rounded-full p-2 shadow-2xl border border-white/50 flex items-center justify-between max-w-md mx-auto">
            <div className="px-6 hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                {t("profile.saveChanges")}
              </p>
            </div>
            <Button
              type="submit"
              size="xl"
              disabled={isLoading || isUploading}
              aria-busy={isLoading}
              className="w-full sm:w-auto h-14 sm:h-12 px-10 rounded-full bg-brand-500 hover:bg-brand-700 text-white shadow-lg shadow-brand-200 hover:shadow-brand-300 transition-all duration-300 font-bold tracking-wider uppercase text-[12px]"
            >
              {isLoading ? (
                <Spinner variant="light" size="sm" />
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {t("profile.saveChanges")}
                </span>
              )}
            </Button>
          </div>
        </m.div>
      </form>
    </m.div>
  );
}
