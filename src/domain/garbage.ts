import type { Profile } from "./profile";

export interface GarbageSchedule {
  id: string;
  garbage_type: string;
  day_of_week: number;
  notes: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface GarbageDuty {
  id: string;
  user_id: string;
  duty_date: string;
  garbage_type: string;
  is_completed: boolean;
  created_at: string;
}

export interface GarbageDutyWithProfile extends GarbageDuty {
  profile: Profile | null;
}

export interface GarbageScheduleInput {
  garbage_type: string;
  day_of_week: number;
  notes?: string | null;
}

export interface GarbageDutyInput {
  user_id: string;
  duty_date: string;
  garbage_type: string;
}

export const DAY_NAMES_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;
export const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
