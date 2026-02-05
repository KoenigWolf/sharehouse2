export const MBTI_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
   Analysts: {
      bg: "bg-purple-50/50",
      text: "text-purple-700",
      border: "border-purple-100",
      icon: "text-purple-400"
   },
   Diplomats: {
      bg: "bg-emerald-50/50",
      text: "text-emerald-700",
      border: "border-emerald-100",
      icon: "text-emerald-400"
   },
   Sentinels: {
      bg: "bg-blue-50/50",
      text: "text-blue-700",
      border: "border-blue-100",
      icon: "text-blue-400"
   },
   Explorers: {
      bg: "bg-amber-50/50",
      text: "text-amber-700",
      border: "border-amber-100",
      icon: "text-amber-400"
   },
} as const;
