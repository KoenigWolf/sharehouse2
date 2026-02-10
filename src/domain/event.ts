export interface Event {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventWithDetails extends Event {
  profiles: {
    name: string;
    nickname: string | null;
    avatar_url: string | null;
  } | null;
  event_attendees: { user_id: string }[];
}
