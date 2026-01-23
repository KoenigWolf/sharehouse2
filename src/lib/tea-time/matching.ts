import { SupabaseClient } from "@supabase/supabase-js";

interface Participant {
  user_id: string;
}

interface RecentMatch {
  user1_id: string;
  user2_id: string;
  matched_at: string;
}

/**
 * マッチングを実行する
 * @returns 作成されたマッチの数
 */
export async function runMatching(supabase: SupabaseClient): Promise<number> {
  // 1. 参加ONのユーザーを取得
  const { data: participants, error: participantsError } = await supabase
    .from("tea_time_settings")
    .select("user_id")
    .eq("is_enabled", true);

  if (participantsError || !participants || participants.length < 2) {
    return 0;
  }

  // 2. 直近30日のマッチ履歴を取得
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentMatches } = await supabase
    .from("tea_time_matches")
    .select("user1_id, user2_id, matched_at")
    .gte("matched_at", thirtyDaysAgo.toISOString());

  // 3. ペアリング実行
  const pairs = createPairs(
    participants as Participant[],
    (recentMatches as RecentMatch[]) || []
  );

  if (pairs.length === 0) {
    return 0;
  }

  // 4. マッチ結果を保存
  const matchRecords = pairs.map(([user1, user2]) => ({
    user1_id: user1,
    user2_id: user2,
    status: "scheduled",
  }));

  const { error: insertError } = await supabase
    .from("tea_time_matches")
    .insert(matchRecords);

  if (insertError) {
    console.error("Failed to insert matches:", insertError);
    return 0;
  }

  return pairs.length;
}

/**
 * 参加者をペアリングする
 * 直近でマッチした相手は避けるように重み付け
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

  // シャッフル
  const shuffled = [...userIds].sort(() => Math.random() - 0.5);

  for (const userId of shuffled) {
    if (matched.has(userId)) continue;

    // このユーザーとペアになれる候補を探す
    const candidates = shuffled.filter(
      (id) => id !== userId && !matched.has(id)
    );

    if (candidates.length === 0) break;

    // 直近マッチ回数が少ない相手を優先（重み付け選択）
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
 * 重み付けでパートナーを選択
 * 直近マッチ回数が多いほど選ばれにくい
 */
function selectPartnerWithWeight(
  userId: string,
  candidates: string[],
  recentPairCount: Map<string, number>
): string | null {
  if (candidates.length === 0) return null;

  // 各候補の重みを計算（直近マッチ回数が多いほど重みが小さい）
  const weights = candidates.map((candidateId) => {
    const key = getPairKey(userId, candidateId);
    const matchCount = recentPairCount.get(key) || 0;
    // マッチ回数0なら重み10、1回なら5、2回以上なら1
    return matchCount === 0 ? 10 : matchCount === 1 ? 5 : 1;
  });

  // 重み付きランダム選択
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
 * ペアのキーを生成（順序に依存しない）
 */
function getPairKey(user1: string, user2: string): string {
  return [user1, user2].sort().join("-");
}
