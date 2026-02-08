import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service Role クライアント（ユーザー削除などの管理操作用）
 *
 * SUPABASE_SERVICE_ROLE_KEY は NEXT_PUBLIC_ ではないため
 * サーバーサイドでのみ使用可能。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
