import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { TeaTimeMatchCard } from "@/components/tea-time-match-card";
import { getTeaTimeSetting, getMyMatches } from "@/lib/tea-time/actions";

export default async function TeaTimePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [setting, matches] = await Promise.all([
    getTeaTimeSetting(user.id),
    getMyMatches(),
  ]);

  const isEnabled = setting?.is_enabled ?? false;
  const scheduledMatches = matches.filter((m) => m.status === "scheduled");
  const pastMatches = matches.filter((m) => m.status !== "scheduled");

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Header />
      <main className="container mx-auto px-4 py-4 max-w-lg">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg text-[#1a1a1a] tracking-wide">ティータイム</h2>
          <span className="text-xs text-[#a3a3a3]">ランダムマッチ</span>
        </div>

        {/* 参加状況 */}
        <Link href="/settings" className="block mb-4">
          <div className="bg-white border border-[#e5e5e5] p-4 hover:border-[#b94a48] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">☕</span>
                <div>
                  <p className="text-sm text-[#1a1a1a]">
                    {isEnabled ? "参加中" : "不参加"}
                  </p>
                  <p className="text-[11px] text-[#a3a3a3]">
                    {isEnabled ? "マッチング対象です" : "マイページで参加設定できます"}
                  </p>
                </div>
              </div>
              <span className="text-xs text-[#a3a3a3]">設定 →</span>
            </div>
          </div>
        </Link>

        {/* 新しいマッチ */}
        {scheduledMatches.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs text-[#737373] tracking-wide mb-2">新しいマッチ</h3>
            <div className="space-y-2">
              {scheduledMatches.map((match) => (
                <TeaTimeMatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* 過去のマッチ */}
        {pastMatches.length > 0 && (
          <div>
            <h3 className="text-xs text-[#737373] tracking-wide mb-2">履歴</h3>
            <div className="space-y-2">
              {pastMatches.map((match) => (
                <TeaTimeMatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* マッチがない場合 */}
        {matches.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-[#737373]">まだマッチがありません</p>
            {isEnabled ? (
              <p className="text-xs text-[#a3a3a3] mt-1">次のマッチングをお待ちください</p>
            ) : (
              <Link href="/settings" className="text-xs text-[#b94a48] hover:underline mt-1 inline-block">
                マイページで参加をONにする →
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
