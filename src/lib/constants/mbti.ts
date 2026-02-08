export const MBTI_COLORS: Record<string, { bg: string; text: string; border: string; icon: string; hero: string }> = {
  Analysts: {
    bg: "mbti-analysts-bg",
    text: "mbti-analysts-text",
    border: "mbti-analysts-border",
    icon: "mbti-analysts-icon",
    hero: "mbti-analysts-hero",
  },
  Diplomats: {
    bg: "mbti-diplomats-bg",
    text: "mbti-diplomats-text",
    border: "mbti-diplomats-border",
    icon: "mbti-diplomats-icon",
    hero: "mbti-diplomats-hero",
  },
  Sentinels: {
    bg: "mbti-sentinels-bg",
    text: "mbti-sentinels-text",
    border: "mbti-sentinels-border",
    icon: "mbti-sentinels-icon",
    hero: "mbti-sentinels-hero",
  },
  Explorers: {
    bg: "mbti-explorers-bg",
    text: "mbti-explorers-text",
    border: "mbti-explorers-border",
    icon: "mbti-explorers-icon",
    hero: "mbti-explorers-hero",
  },
} as const;
