export type FloorId = "2F" | "3F" | "4F" | "5F";

export interface FloorColorConfig {
  bg: string;
  border: string;
  text: string;
  /** Tailwind bg class for emphasis (e.g. "bg-brand-500") */
  accent: string;
  /** CSS color value for style={{}} (e.g. "var(--brand-500)") */
  fill: string;
}

export const FLOOR_COLORS: Record<FloorId | "?", FloorColorConfig> = {
  "5F": { bg: "bg-brand-50", border: "border-brand-100", text: "text-brand-900", accent: "bg-brand-500", fill: "var(--brand-500)" },
  "4F": { bg: "bg-slate-50", border: "border-slate-100", text: "text-slate-900", accent: "bg-slate-600", fill: "#475569" },
  "3F": { bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-900", accent: "bg-violet-500", fill: "#8b5cf6" },
  "2F": { bg: "bg-brand-50", border: "border-brand-100", text: "text-brand-900", accent: "bg-brand-500", fill: "var(--brand-500)" },
  "?": { bg: "bg-slate-50", border: "border-slate-100", text: "text-slate-400", accent: "bg-slate-400", fill: "#94a3b8" },
};

export function getFloorFromRoom(roomNumber: string | null): string {
  if (!roomNumber) return "?";
  return `${roomNumber[0]}F`;
}

export function isNewResident(moveInDate: string | null): boolean {
  if (!moveInDate) return false;
  const moveIn = new Date(moveInDate);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return moveIn > threeMonthsAgo;
}
