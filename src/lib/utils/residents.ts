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
  "4F": { bg: "floor-slate-bg", border: "floor-slate-border", text: "floor-slate-text", accent: "bg-secondary", fill: "var(--floor-slate)" },
  "3F": { bg: "floor-violet-bg", border: "floor-violet-border", text: "floor-violet-text", accent: "bg-primary", fill: "var(--floor-violet)" },
  "2F": { bg: "bg-brand-50", border: "border-brand-100", text: "text-brand-900", accent: "bg-brand-500", fill: "var(--brand-500)" },
  "?": { bg: "floor-slate-bg", border: "floor-slate-border", text: "text-muted-foreground", accent: "bg-muted", fill: "var(--floor-slate)" },
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
