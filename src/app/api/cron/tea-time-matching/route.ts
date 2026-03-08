import { NextResponse } from "next/server";
import { runMatching } from "@/lib/tea-time/matching";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCronSecret } from "@/lib/security";
import { logError } from "@/lib/errors";

/**
 * ティータイムマッチング Cron ハンドラー
 *
 * 週次で実行し、参加者をペアリングして tea_time_matches に挿入する。
 * service_role 権限で実行するため RLS をバイパスする。
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!validateCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const matchCount = await runMatching(supabase);

    return NextResponse.json({
      success: true,
      matchesCreated: matchCount,
    });
  } catch (error) {
    logError(error, { action: "teaTimeMatchingCron" });
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
