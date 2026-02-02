export interface RoomPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  taken_at: string | null;
  display_order: number;
  created_at: string;
}
