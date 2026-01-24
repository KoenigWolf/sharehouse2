// Valid MBTI types
export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export type MBTIType = typeof MBTI_TYPES[number];

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
