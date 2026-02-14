import { cache } from "react";
import { connection } from "next/server";
import { logError } from "@/lib/errors";
import { mockProfiles } from "@/lib/mock-data";
import type { Profile } from "@/domain/profile";
import type { SupabaseClient } from "@supabase/supabase-js";

export const PROFILE_BASE_COLUMNS = `
  id,
  name,
  nickname,
  room_number,
  bio,
  avatar_url,
  interests,
  mbti,
  move_in_date,
  is_admin,
  created_at,
  updated_at,
  age_range,
  gender,
  nationality,
  languages,
  hometown,
  occupation,
  industry,
  work_location,
  work_style,
  daily_rhythm,
  home_frequency,
  alcohol,
  smoking,
  pets,
  guest_frequency,
  social_stance,
  shared_space_usage,
  cleaning_attitude,
  cooking_frequency,
  shared_meals,
  personality_type,
  weekend_activities,
  allergies,
  sns_x,
  sns_instagram,
  sns_facebook,
  sns_linkedin,
  sns_github,
  cover_photo_url,
  theme_style,
  color_mode
` as const;

export interface PublicProfileTeaser {
  id: string;
  masked_name: string;
  masked_nickname: string | null;
  masked_bio: string | null;
  age_range: string | null;
  occupation: string | null;
  industry: string | null;
  created_at: string;
}

/**
 * プロフィール一覧を取得し、未登録部屋のモックデータをマージして返す
 * @param orderBy ソート対象カラム（デフォルト: "name"）
 */
export const getProfilesWithMock = cache(async function getProfilesWithMock(
  supabase: SupabaseClient,
  orderBy: string = "name",
): Promise<{ profiles: Profile[]; dbProfiles: Profile[] }> {
  await connection();

  const [profilesRes, bulletinsRes] = await Promise.all([
    supabase.from("profiles").select(PROFILE_BASE_COLUMNS).order(orderBy),
    supabase
      .from("latest_bulletins_per_user")
      .select("user_id, message, updated_at"),
  ]);

  if (profilesRes.error) {
    logError(profilesRes.error, { action: "getProfilesWithMock:profiles", metadata: { orderBy } });
  }
  if (bulletinsRes.error) {
    logError(bulletinsRes.error, { action: "getProfilesWithMock:bulletins" });
  }

  const vibeMap = new Map<string, { message: string; updated_at: string }>();
  if (bulletinsRes.data) {
    for (const b of bulletinsRes.data) {
      vibeMap.set(b.user_id, {
        message: b.message,
        updated_at: b.updated_at,
      });
    }
  }

  const dbProfiles = (profilesRes.data ?? []).map((p) => ({
    ...p,
    vibe: vibeMap.get(p.id) || null,
  })) as Profile[];

  const registeredRoomNumbers = new Set(
    dbProfiles.filter((p) => p.room_number).map((p) => p.room_number),
  );
  const remainingMockProfiles = mockProfiles.filter(
    (mock) => !registeredRoomNumbers.has(mock.room_number),
  ).map(mock => ({
    ...mock,
    vibe: null,
  })) as Profile[];

  return {
    profiles: [...dbProfiles, ...remainingMockProfiles],
    dbProfiles,
  };
});

/** 未認証ユーザー向けの公開チラ見せデータを取得する */
export const getPublicProfilesWithMock = cache(async function getPublicProfilesWithMock(
  supabase: SupabaseClient,
): Promise<{ profiles: PublicProfileTeaser[] }> {
  await connection();

  const { data, error } = await supabase
    .from("residents_public_teaser")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    logError(error, { action: "getPublicProfilesWithMock" });
  }

  const dbTeasers = (data as PublicProfileTeaser[]) ?? [];

  const remainingMockTeasers: PublicProfileTeaser[] = mockProfiles
    .filter((mock) => !dbTeasers.some((db) => db.id === mock.id))
    .map((mock) => ({
      id: mock.id,
      masked_name: (mock.name?.[0] || "") + "***",
      masked_nickname: mock.nickname ? mock.nickname[0] + "***" : null,
      masked_bio: mock.bio ? mock.bio.substring(0, 50) : null,
      age_range: mock.age_range || "20s",
      occupation: mock.occupation || "other",
      industry: mock.industry || "other",
      created_at: mock.created_at,
    }));

  return {
    profiles: [...dbTeasers, ...remainingMockTeasers].slice(0, 20),
  };
});
