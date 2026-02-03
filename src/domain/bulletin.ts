export interface Bulletin {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export interface BulletinWithProfile extends Bulletin {
  profiles: {
    name: string;
    nickname: string | null;
    avatar_url: string | null;
    room_number: string | null;
  } | null;
}
