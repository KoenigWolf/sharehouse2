export type ShareItemStatus = "available" | "claimed";

export interface ShareItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: ShareItemStatus;
  claimed_by: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface ShareItemWithProfile extends ShareItem {
  profiles: {
    name: string;
    nickname: string | null;
    avatar_url: string | null;
    room_number: string | null;
  } | null;
}
