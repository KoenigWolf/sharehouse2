import { cache } from "react";
import { createClient } from "./server";
import type { Profile } from "@/domain/profile";

/**
 * React cache() でリクエスト単位キャッシュ
 * 同一リクエスト内で複数回呼び出しても Supabase へのリクエストは1回のみ
 */

export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error, supabase };
});

export const getCachedUserProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("avatar_url, is_admin, theme_style, color_mode")
    .eq("id", userId)
    .single();

  return { data, error };
});

export const getCachedFullProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id, name, nickname, room_number, bio, avatar_url, interests, mbti,
      move_in_date, is_admin, age_range, gender, nationality, languages,
      hometown, occupation, industry, work_location, work_style, daily_rhythm,
      home_frequency, alcohol, smoking, pets, guest_frequency, social_stance,
      shared_space_usage, cleaning_attitude, cooking_frequency, shared_meals,
      personality_type, weekend_activities, allergies, sns_x, sns_instagram,
      sns_facebook, sns_linkedin, sns_github, cover_photo_url, theme_style, color_mode,
      created_at, updated_at
    `)
    .eq("id", userId)
    .single();

  return { data: data as Profile | null, error };
});

export const getCachedAuthWithProfile = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      userId: null,
      avatarUrl: null,
      isAdmin: false,
      themeStyle: null,
      colorMode: null,
    };
  }

  const { data } = await supabase
    .from("profiles")
    .select("avatar_url, is_admin, theme_style, color_mode")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    avatarUrl: data?.avatar_url ?? null,
    isAdmin: data?.is_admin === true,
    themeStyle: data?.theme_style ?? null,
    colorMode: data?.color_mode ?? null,
  };
});
