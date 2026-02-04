import { logError } from "@/lib/errors";
import { mockProfiles } from "@/lib/mock-data";
import type { Profile } from "@/domain/profile";
import type { SupabaseClient } from "@supabase/supabase-js";

export const PROFILE_SELECT_COLUMNS =
  "id, name, nickname, room_number, avatar_url, move_in_date, mbti, interests, occupation, industry, work_style, daily_rhythm, social_stance, sns_x, sns_instagram, sns_github, is_admin" as const;

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
