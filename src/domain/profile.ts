export interface Profile {
  id: string;
  name: string;
  room_number: string | null;
  bio: string | null;
  avatar_url: string | null;
  interests: string[];
  move_in_date: string | null;
  created_at: string;
  updated_at: string;
}
