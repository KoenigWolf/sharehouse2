import { SupabaseClient } from "@supabase/supabase-js";
import { logError } from "@/lib/errors";

interface Participant {
  user_id: string;
}

interface RecentMatch {
  user1_id: string;
  user2_id: string;
  matched_at: string;
}

/**
 * ティータイムのマッチングを実行する
 *
 * 参加者全員から重み付きランダムでペアを作成し、tea_time_matchesテーブルに挿入する。
 * 直近30日間のマッチ履歴を参照し、同じ相手との再マッチを抑制する。
 * 参加者が2人未満の場合は何もしない。
 *
 * @param supabase - Supabaseクライアントインスタンス
 * @returns 作成されたマッチの数
 */
export async function runMatching(supabase: SupabaseClient): Promise<number> {
  const { data: participants, error: participantsError } = await supabase
    .from("tea_time_settings")
    .select("user_id")
    .eq("is_enabled", true);

  if (participantsError || !participants || participants.length < 2) {
    return 0;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentMatches } = await supabase
    .from("tea_time_matches")
    .select("user1_id, user2_id, matched_at")
    .gte("matched_at", thirtyDaysAgo.toISOString());

  const pairs = createPairs(
    participants as Participant[],
    (recentMatches ?? []) as RecentMatch[]
  );

  if (pairs.length === 0) {
    return 0;
  }

  const matchRecords = pairs.map(([user1, user2]) => ({
    user1_id: user1,
    user2_id: user2,
    status: "scheduled",
  }));

  const { error: insertError } = await supabase
    .from("tea_time_matches")
    .insert(matchRecords);

  if (insertError) {
    logError(insertError, { action: "createTeaTimeMatches" });
    return 0;
  }

  return pairs.length;
}

/**
 * 参加者をペアリングする
 *
 * シャッフルした参加者リストを順に走査し、未マッチの候補から重み付きで
 * パートナーを選択する。直近マッチ回数が多いほど選ばれにくくなる。
 *
 * @param participants - 参加者リスト
 * @param recentMatches - 直近30日間のマッチ履歴
 * @returns ペア配列（[user1_id, user2_id]の配列）
 */
function createPairs(
  participants: Participant[],
  recentMatches: RecentMatch[]
): [string, string][] {
  const userIds = participants.map((p) => p.user_id);
  const pairs: [string, string][] = [];
  const matched = new Set<string>();

  // 直近マッチのペアをマップ化（重み計算用）
  const recentPairCount = new Map<string, number>();
  for (const match of recentMatches) {
    const key = getPairKey(match.user1_id, match.user2_id);
    recentPairCount.set(key, (recentPairCount.get(key) || 0) + 1);
  }

  const shuffled = [...userIds].sort(() => Math.random() - 0.5);

  for (const userId of shuffled) {
    if (matched.has(userId)) continue;

    const candidates = shuffled.filter(
      (id) => id !== userId && !matched.has(id)
    );

    if (candidates.length === 0) break;

    const partner = selectPartnerWithWeight(userId, candidates, recentPairCount);

    if (partner) {
      pairs.push([userId, partner]);
      matched.add(userId);
      matched.add(partner);
    }
  }

  return pairs;
}

/**
 * 重み付きランダムでパートナーを選択する
 *
 * 重みルール: マッチ0回=10、1回=5、2回以上=1
 *
 * @param userId - 対象ユーザーID
 * @param candidates - 候補者ID配列
 * @param recentPairCount - ペアキー→マッチ回数のマップ
 * @returns 選択されたパートナーID、候補なしの場合 null
 */
function selectPartnerWithWeight(
  userId: string,
  candidates: string[],
  recentPairCount: Map<string, number>
): string | null {
  if (candidates.length === 0) return null;

  const weights = candidates.map((candidateId) => {
    const key = getPairKey(userId, candidateId);
    const matchCount = recentPairCount.get(key) || 0;
    return matchCount === 0 ? 10 : matchCount === 1 ? 5 : 1;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < candidates.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return candidates[i];
    }
  }

  return candidates[candidates.length - 1];
}

/**
 * ペアの一意キーを生成する（順序に依存しない）
 *
 * 2つのIDをソートして結合することで、(A,B) と (B,A) が同じキーになる。
 *
 * @param user1 - ユーザーID 1
 * @param user2 - ユーザーID 2
 * @returns ソート済みIDをハイフンで結合した文字列
 */
function getPairKey(user1: string, user2: string): string {
  return [user1, user2].sort().join("-");
}
