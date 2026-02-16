import "react-native-url-polyfill/dist/polyfill";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Secure storage adapter for auth tokens
const SecureStoreAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types from web app
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  nickname: string | null;
  room_number: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  mbti: string | null;
  hobbies: string[] | null;
  occupation: string | null;
  lifestyle: string | null;
  move_in_date: string | null;
  social_links: Record<string, string> | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface BulletinMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  updated_at: string;
  profiles: Profile;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  profiles: Profile;
  attendees: { user_id: string; profiles: Profile }[];
}

export interface ShareItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  status: "available" | "claimed";
  claimed_by: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  profiles: Profile;
}
