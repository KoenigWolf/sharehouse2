import { logError } from "@/lib/errors";
import { mockProfiles } from "@/lib/mock-data";
import type { Profile } from "@/domain/profile";
import type { SupabaseClient } from "@supabase/supabase-js";

export const PROFILE_SELECT_COLUMNS =
  "id, name, nickname, room_number, avatar_url, move_in_date, mbti, interests, occupation, industry, work_style, daily_rhythm, social_stance, sns_x, sns_instagram, sns_github, is_admin" as const;

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
export async function getProfilesWithMock(
  supabase: SupabaseClient,
  orderBy: string = "name",
): Promise<{ profiles: Profile[]; dbProfiles: Profile[] }> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT_COLUMNS)
    .order(orderBy);

  if (error) {
    logError(error, { action: "getProfilesWithMock", metadata: { orderBy } });
  }

  const dbProfiles = (data as Profile[]) ?? [];

  const registeredRoomNumbers = new Set(
    dbProfiles.filter((p) => p.room_number).map((p) => p.room_number),
  );
  const remainingMockProfiles = mockProfiles.filter(
    (mock) => !registeredRoomNumbers.has(mock.room_number),
  );

  return {
    profiles: [...dbProfiles, ...remainingMockProfiles],
    dbProfiles,
  };
}

/**
 * 未認証ユーザー向けの公開チラ見せデータを取得する
 */
export async function getPublicProfilesWithMock(
  supabase: SupabaseClient,
): Promise<{ profiles: PublicProfileTeaser[] }> {
  const { data, error } = await supabase
    .from("residents_public_teaser")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    logError(error, { action: "getPublicProfilesWithMock" });
  }

  const dbTeasers = (data as PublicProfileTeaser[]) ?? [];

  // モックデータもマスクして追加（一貫性のため）
  const remainingMockTeasers: PublicProfileTeaser[] = mockProfiles
    .filter((mock) => !dbTeasers.some((db) => db.masked_name === ((mock.name?.[0] || "") + "***")))
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
    profiles: [...dbTeasers, ...remainingMockTeasers].slice(0, 20), // 20件までに制限
  };
}
