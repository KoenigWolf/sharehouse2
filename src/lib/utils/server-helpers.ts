import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Translator } from "@/lib/i18n";

/**
 * Require authenticated user or return error response.
 *
 * Consolidates the common pattern:
 * ```typescript
 * if (!user) return { error: t("errors.unauthorized") };
 * ```
 *
 * @example
 * ```typescript
 * const authResult = requireAuthUser(user, t);
 * if ("error" in authResult) return authResult;
 * // authResult.user is now guaranteed to be non-null
 * ```
 */
export function requireAuthUser(
  user: User | null,
  t: Translator
): { success: true; user: User } | { error: string } {
  if (!user) {
    return { error: t("errors.unauthorized") };
  }
  return { success: true, user };
}

/**
 * Minimal profile data for batch fetching.
 */
export interface MinimalProfile {
  id: string;
  name: string;
  avatar_url: string | null;
}

/**
 * Fetch profiles by IDs and return as a Map for O(1) lookup.
 *
 * Consolidates the common N+1 prevention pattern:
 * ```typescript
 * const userIds = [...new Set(items.map(item => item.user_id))];
 * const { data: profiles } = await supabase
 *   .from("profiles")
 *   .select("id, name, avatar_url")
 *   .in("id", userIds);
 * const profileMap = new Map();
 * if (profiles) {
 *   for (const profile of profiles) {
 *     profileMap.set(profile.id, profile);
 *   }
 * }
 * ```
 *
 * @param supabase - Supabase client
 * @param userIds - Array of user IDs to fetch
 * @param selectColumns - Optional columns to select (default: "id, name, avatar_url")
 * @returns Map of user ID to profile
 */
export async function fetchProfileMap<T extends MinimalProfile = MinimalProfile>(
  supabase: SupabaseClient,
  userIds: string[],
  selectColumns = "id, name, avatar_url"
): Promise<Map<string, T>> {
  const profileMap = new Map<string, T>();

  if (userIds.length === 0) {
    return profileMap;
  }

  const uniqueIds = [...new Set(userIds)];

  const { data: profiles } = await supabase
    .from("profiles")
    .select(selectColumns)
    .in("id", uniqueIds);

  if (profiles) {
    for (const profile of profiles) {
      const typedProfile = profile as unknown as T;
      profileMap.set(typedProfile.id, typedProfile);
    }
  }

  return profileMap;
}
