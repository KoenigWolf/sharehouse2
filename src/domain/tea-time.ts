import { Profile } from "./profile";

export interface TeaTimeSetting {
  user_id: string;
  is_enabled: boolean;
  preferred_time: string | null;
  created_at: string;
  updated_at: string;
}

export type MatchStatus = "scheduled" | "done" | "skipped";

export interface TeaTimeMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
  status: MatchStatus;
  created_at: string;
}

export interface TeaTimeMatchWithPartner extends TeaTimeMatch {
  partner: Profile;
}
