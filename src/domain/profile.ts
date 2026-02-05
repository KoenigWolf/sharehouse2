export const ROOM_NUMBERS = [
  "201", "202", "203", "204", "205",
  "301", "302", "303", "304", "305",
  "401", "402", "403", "404", "405",
  "501", "502", "503", "504", "505",
] as const;

export type RoomNumber = typeof ROOM_NUMBERS[number];

export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export const AGE_RANGES = ["10s", "20s", "30s", "40s", "50plus"] as const;
export const GENDERS = ["male", "female", "other", "noAnswer"] as const;
export const OCCUPATIONS = ["employee", "freelance", "student", "executive", "other"] as const;
export const INDUSTRIES = ["it", "finance", "medical", "education", "creative", "other"] as const;
export const WORK_STYLES = ["office", "remote", "hybrid"] as const;
export const DAILY_RHYTHMS = ["morning", "night", "irregular"] as const;
export const HOME_FREQUENCIES = ["everyday", "weekdaysOnly", "weekendsOnly", "oftenAway"] as const;
export const ALCOHOL_OPTIONS = ["drink", "sometimes", "noDrink"] as const;
export const SMOKING_OPTIONS = ["smoke", "noSmoke"] as const;
export const PET_OPTIONS = ["wantPets", "noPets", "either"] as const;
export const GUEST_FREQUENCIES = ["often", "sometimes", "rarely"] as const;
export const SOCIAL_STANCES = ["active", "moderate", "quiet"] as const;
export const CLEANING_ATTITUDES = ["strict", "moderate", "relaxed"] as const;
export const COOKING_FREQUENCIES = ["daily", "fewTimesWeek", "sometimes", "never"] as const;
export const SHARED_MEAL_OPTIONS = ["wantToJoin", "sometimes", "rarely", "noJoin"] as const;
export const LANGUAGES = ["japanese", "english", "chinese", "korean", "other"] as const;

export type AgeRange = typeof AGE_RANGES[number];
export type Gender = typeof GENDERS[number];
export type Occupation = typeof OCCUPATIONS[number];
export type Industry = typeof INDUSTRIES[number];
export type WorkStyle = typeof WORK_STYLES[number];
export type DailyRhythm = typeof DAILY_RHYTHMS[number];
export type HomeFrequency = typeof HOME_FREQUENCIES[number];
export type AlcoholOption = typeof ALCOHOL_OPTIONS[number];
export type SmokingOption = typeof SMOKING_OPTIONS[number];
export type PetOption = typeof PET_OPTIONS[number];
export type GuestFrequency = typeof GUEST_FREQUENCIES[number];
export type SocialStance = typeof SOCIAL_STANCES[number];
export type CleaningAttitude = typeof CLEANING_ATTITUDES[number];
export type CookingFrequency = typeof COOKING_FREQUENCIES[number];
export type SharedMealOption = typeof SHARED_MEAL_OPTIONS[number];
export type Language = typeof LANGUAGES[number];

export type MBTIType = typeof MBTI_TYPES[number];

export const MBTI_LABELS: Record<MBTIType, { ja: string; en: string }> = {
  INTJ: { ja: "建築家", en: "Architect" },
  INTP: { ja: "論理学者", en: "Logician" },
  ENTJ: { ja: "指揮官", en: "Commander" },
  ENTP: { ja: "討論者", en: "Debater" },
  INFJ: { ja: "提唱者", en: "Advocate" },
  INFP: { ja: "仲介者", en: "Mediator" },
  ENFJ: { ja: "主人公", en: "Protagonist" },
  ENFP: { ja: "運動家", en: "Campaigner" },
  ISTJ: { ja: "管理者", en: "Logistician" },
  ISFJ: { ja: "擁護者", en: "Defender" },
  ESTJ: { ja: "幹部", en: "Executive" },
  ESFJ: { ja: "領事官", en: "Consul" },
  ISTP: { ja: "巨匠", en: "Virtuoso" },
  ISFP: { ja: "冒険家", en: "Adventurer" },
  ESTP: { ja: "起業家", en: "Entrepreneur" },
  ESFP: { ja: "エンターテイナー", en: "Entertainer" },
};

export interface Profile {
  id: string;
  name: string;
  room_number: string | null;
  bio: string | null;
  avatar_url: string | null;
  interests: string[];
  mbti: MBTIType | null;
  move_in_date: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  nickname?: string | null;
  age_range?: string | null;
  gender?: string | null;
  nationality?: string | null;
  languages?: string[];
  hometown?: string | null;
  occupation?: string | null;
  industry?: string | null;
  work_location?: string | null;
  work_style?: string | null;
  daily_rhythm?: string | null;
  home_frequency?: string | null;
  alcohol?: string | null;
  smoking?: string | null;
  pets?: string | null;
  guest_frequency?: string | null;
  social_stance?: string | null;
  shared_space_usage?: string | null;
  cleaning_attitude?: string | null;
  cooking_frequency?: string | null;
  shared_meals?: string | null;
  personality_type?: string | null;
  weekend_activities?: string | null;
  allergies?: string | null;
  sns_x?: string | null;
  sns_instagram?: string | null;
  sns_facebook?: string | null;
  sns_linkedin?: string | null;
  sns_github?: string | null;
  cover_photo_url?: string | null;
  vibe?: {
    message: string;
    updated_at: string;
  } | null;
}

export const MBTI_GROUPS = {
  Analysts: ["INTJ", "INTP", "ENTJ", "ENTP"],
  Diplomats: ["INFJ", "INFP", "ENFJ", "ENFP"],
  Sentinels: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
  Explorers: ["ISTP", "ISFP", "ESTP", "ESFP"],
} as const;

export function getMBTIGroup(mbti: string): keyof typeof MBTI_GROUPS {
  for (const [group, types] of Object.entries(MBTI_GROUPS)) {
    if ((types as readonly string[]).includes(mbti)) return group as keyof typeof MBTI_GROUPS;
  }
  return "Sentinels"; // Fallback
}
