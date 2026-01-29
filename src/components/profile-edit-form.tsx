"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Profile, MBTI_TYPES, MBTI_LABELS, MBTIType, ROOM_NUMBERS } from "@/domain/profile";
import { updateProfile, uploadAvatar } from "@/lib/profile/actions";
import { updateTeaTimeSetting } from "@/lib/tea-time/actions";
import { getInitials } from "@/lib/utils";
import { useI18n, useLocale } from "@/hooks/use-i18n";

interface ProfileEditFormProps {
  profile: Profile;
  initialTeaTimeEnabled?: boolean;
}

type SectionType = "basic" | "extended" | "work" | "lifestyle" | "communal" | "personality" | "sns";

const sectionConfig: Record<SectionType, { color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  basic: {
    color: "text-[#1a1a1a]",
    bgColor: "bg-white",
    borderColor: "border-[#e5e5e5]",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  extended: {
    color: "text-[#8b7355]",
    bgColor: "bg-[#faf9f7]",
    borderColor: "border-[#e8e4df]",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
      </svg>
    ),
  },
  work: {
    color: "text-[#5c6b7a]",
    bgColor: "bg-[#f8f9fa]",
    borderColor: "border-[#dfe3e8]",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
  lifestyle: {
    color: "text-[#7a6b5c]",
    bgColor: "bg-[#faf9f8]",
    borderColor: "border-[#e8e4df]",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ),
  },
  communal: {
    color: "text-[#5c7a6b]",
    bgColor: "bg-[#f8faf9]",
    borderColor: "border-[#dfe8e3]",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
  personality: {
    color: "text-[#7a5c6b]",
    bgColor: "bg-[#faf8f9]",
    borderColor: "border-[#e8dfe3]",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
  },
  sns: {
    color: "text-[#5c6b7a]",
    bgColor: "bg-[#f8f9fa]",
    borderColor: "border-[#dfe3e8]",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
      </svg>
    ),
  },
};

function FormSection({
  id,
  title,
  sectionType,
  isExpanded,
  onToggle,
  filledCount,
  totalCount,
  children,
}: {
  id: string;
  title: string;
  sectionType: SectionType;
  isExpanded: boolean;
  onToggle: () => void;
  filledCount?: number;
  totalCount?: number;
  children: React.ReactNode;
}) {
  const config = sectionConfig[sectionType];
  const showProgress = filledCount !== undefined && totalCount !== undefined && totalCount > 0;

  return (
    <m.div
      initial={false}
      animate={{ backgroundColor: isExpanded ? config.bgColor.replace("bg-", "") : "#ffffff" }}
      className={`border ${config.borderColor} overflow-hidden`}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={onToggle}
        className={`w-full h-auto px-5 py-4 flex items-center justify-between hover:bg-[#fafaf8] ${config.bgColor}`}
      >
        <div className="flex items-center gap-3">
          <span className={config.color}>{config.icon}</span>
          <span className={`text-sm tracking-wide ${config.color}`}>{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {showProgress && (
            <span className="text-[10px] text-[#a3a3a3]">
              {filledCount}/{totalCount}
            </span>
          )}
          <m.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-[#a3a3a3]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </m.span>
        </div>
      </Button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            key={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-2 space-y-4 border-t border-[#f0f0f0]">
              {children}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
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
        className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
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
        className="w-full h-11 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors"
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
        className="w-full px-4 py-3 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors resize-none leading-relaxed"
      />
      {hint && <p className="text-[10px] text-[#a3a3a3]">{hint}</p>}
    </div>
  );
}

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
    personality_type: profile.personality_type || "",
    weekend_activities: profile.weekend_activities || "",
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

  const sectionFieldCounts = useMemo(() => ({
    extended: {
      filled: [formData.nickname, formData.age_range, formData.gender, formData.hometown, formData.nationality].filter(Boolean).length,
      total: 5,
    },
    work: {
      filled: [formData.occupation, formData.work_style, formData.industry, formData.work_location].filter(Boolean).length,
      total: 4,
    },
    lifestyle: {
      filled: [formData.daily_rhythm, formData.alcohol, formData.smoking, formData.home_frequency, formData.guest_frequency, formData.pets].filter(Boolean).length,
      total: 6,
    },
    communal: {
      filled: [formData.social_stance, formData.cleaning_attitude, formData.cooking_frequency, formData.shared_meals, formData.shared_space_usage].filter(Boolean).length,
      total: 5,
    },
    personality: {
      filled: [formData.personality_type, formData.weekend_activities].filter(Boolean).length,
      total: 2,
    },
    sns: {
      filled: [formData.sns_x, formData.sns_instagram, formData.sns_facebook, formData.sns_linkedin, formData.sns_github].filter(Boolean).length,
      total: 5,
    },
  }), [formData]);

  const completionItems = useMemo(
    () => [
      { label: t("profile.completionItems.photo"), completed: !!avatarUrl },
      { label: t("profile.completionItems.name"), completed: !!formData.name.trim() },
      { label: t("profile.completionItems.roomNumber"), completed: !!formData.room_number.trim() },
      { label: t("profile.completionItems.bio"), completed: !!formData.bio.trim() },
      { label: t("profile.completionItems.interests"), completed: !!formData.interests.trim() },
    ],
    [avatarUrl, formData.name, formData.room_number, formData.bio, formData.interests, t]
  );
  const completedCount = completionItems.filter((i) => i.completed).length;
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  }, []);

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
      personality_type: formData.personality_type.trim() || null,
      weekend_activities: formData.weekend_activities.trim() || null,
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

  const updateField = useCallback((field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/profile/${profile.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#1a1a1a] transition-colors"
        >
          <span aria-hidden="true">←</span>
          <span>{t("common.back")}</span>
        </Link>
        <h1 className="text-lg text-[#1a1a1a] tracking-wide font-light">
          {t("profile.editTitle")}
        </h1>
        <div className="w-16" />
      </div>

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

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white border border-[#e5e5e5] mb-6"
      >
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start">
            <div className="shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={handleAvatarClick}
                disabled={isUploading}
                className="relative w-36 h-36 sm:w-44 sm:h-44 h-auto p-0 bg-[#f5f5f3] group block overflow-hidden hover:bg-[#f5f5f3]"
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
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-6 h-6 border border-[#d4d4d4] border-t-[#1a1a1a] rounded-full"
                    />
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

            <div className="flex-1 w-full text-center sm:text-left">
              <div className="mb-4 p-3 bg-[#fafaf8] border border-[#f0f0f0]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-[#737373] tracking-wide">{t("profile.completionLabel")}</p>
                  <p className="text-sm font-medium text-[#1a1a1a]">{completionPercentage}%</p>
                </div>
                <div className="h-1 bg-[#e5e5e5] overflow-hidden">
                  <m.div
                    className="h-full bg-[#1a1a1a]"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                  {completionItems.map((item) => (
                    <span
                      key={item.label}
                      className={`text-[10px] px-2 py-0.5 ${
                        item.completed
                          ? "bg-[#f0f8f0] text-[#6b8b6b]"
                          : "bg-[#f5f5f3] text-[#a3a3a3]"
                      }`}
                    >
                      {item.completed && "✓ "}{item.label}
                    </span>
                  ))}
                </div>
              </div>

              <m.div
                animate={{
                  backgroundColor: teaTimeEnabled ? "#f0f8f4" : "#fafaf8",
                  borderColor: teaTimeEnabled ? "#a0c9a0" : "#e5e5e5",
                }}
                transition={{ duration: 0.3 }}
                className="p-3 border"
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => !isTeaTimeLoading && handleTeaTimeToggle(!teaTimeEnabled)}
                  disabled={isTeaTimeLoading}
                  className="w-full h-auto p-0 text-left group disabled:opacity-60 disabled:cursor-not-allowed hover:bg-transparent"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <svg
                        className={`w-4 h-4 ${teaTimeEnabled ? "text-[#6b8b6b]" : "text-[#a3a3a3]"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                      </svg>
                      <div>
                        <p className={`text-xs tracking-wide ${teaTimeEnabled ? "text-[#6b8b6b] font-medium" : "text-[#737373]"}`}>
                          {t("teaTime.title")}
                        </p>
                        <p className={`text-[10px] ${teaTimeEnabled ? "text-[#8ba88b]" : "text-[#a3a3a3]"}`}>
                          {teaTimeEnabled ? t("teaTime.participating") : t("teaTime.notParticipating")}
                        </p>
                      </div>
                    </div>
                    <AnimatePresence mode="wait">
                      {isTeaTimeLoading ? (
                        <m.span
                          key="loading"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="inline-block w-5 h-5 border border-[#d4d4d4] border-t-[#1a1a1a] rounded-full"
                        />
                      ) : (
                        <Switch
                          checked={teaTimeEnabled}
                          onCheckedChange={handleTeaTimeToggle}
                          disabled={isTeaTimeLoading}
                          className="data-[state=checked]:bg-[#6b8b6b]"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </Button>
              </m.div>
            </div>
          </div>
        </div>
      </m.div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <FormSection
            id="basic"
            title={t("profile.basicInfo")}
            sectionType="basic"
            isExpanded={expandedSections.includes("basic")}
            onToggle={() => toggleSection("basic")}
          >
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
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-[#f5f5f3] text-[#737373]">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </FormSection>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <FormSection
            id="extended"
            title={t("profile.sectionBasicInfo")}
            sectionType="extended"
            isExpanded={expandedSections.includes("extended")}
            onToggle={() => toggleSection("extended")}
            filledCount={sectionFieldCounts.extended.filled}
            totalCount={sectionFieldCounts.extended.total}
          >
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
          </FormSection>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <FormSection
            id="work"
            title={t("profile.sectionWork")}
            sectionType="work"
            isExpanded={expandedSections.includes("work")}
            onToggle={() => toggleSection("work")}
            filledCount={sectionFieldCounts.work.filled}
            totalCount={sectionFieldCounts.work.total}
          >
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
          </FormSection>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <FormSection
            id="lifestyle"
            title={t("profile.sectionLifestyle")}
            sectionType="lifestyle"
            isExpanded={expandedSections.includes("lifestyle")}
            onToggle={() => toggleSection("lifestyle")}
            filledCount={sectionFieldCounts.lifestyle.filled}
            totalCount={sectionFieldCounts.lifestyle.total}
          >
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
          </FormSection>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <FormSection
            id="communal"
            title={t("profile.sectionCommunal")}
            sectionType="communal"
            isExpanded={expandedSections.includes("communal")}
            onToggle={() => toggleSection("communal")}
            filledCount={sectionFieldCounts.communal.filled}
            totalCount={sectionFieldCounts.communal.total}
          >
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
          </FormSection>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <FormSection
            id="personality"
            title={t("profile.sectionPersonality")}
            sectionType="personality"
            isExpanded={expandedSections.includes("personality")}
            onToggle={() => toggleSection("personality")}
            filledCount={sectionFieldCounts.personality.filled}
            totalCount={sectionFieldCounts.personality.total}
          >
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
          </FormSection>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
        >
          <FormSection
            id="sns"
            title={t("profile.sectionSns")}
            sectionType="sns"
            isExpanded={expandedSections.includes("sns")}
            onToggle={() => toggleSection("sns")}
            filledCount={sectionFieldCounts.sns.filled}
            totalCount={sectionFieldCounts.sns.total}
          >
            <p className="text-[10px] text-[#a3a3a3] -mt-2 mb-2">{t("profile.snsHint")}</p>
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
            <InputField
              id="sns_github"
              label={t("profile.snsGithub")}
              value={formData.sns_github}
              onChange={(v) => updateField("sns_github", v)}
              placeholder={t("profile.snsGithubPlaceholder")}
            />
          </FormSection>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="pt-4"
        >
          <Button
            type="submit"
            size="xl"
            disabled={isLoading || isUploading}
            aria-busy={isLoading}
            aria-label={isLoading ? t("a11y.saving") : t("profile.saveChanges")}
            className="w-full active:scale-[0.99]"
          >
            {isLoading ? (
              <m.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              t("profile.saveChanges")
            )}
          </Button>
        </m.div>
      </form>
    </m.div>
  );
}
