// Valid MBTI types
export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export type MBTIType = typeof MBTI_TYPES[number];

// MBTI type labels (nickname/archetype)
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
  created_at: string;
  updated_at: string;
}
