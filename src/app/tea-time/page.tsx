import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { TeaTimeToggle } from "@/components/tea-time-toggle";
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

  const setting = await getTeaTimeSetting(user.id);
  const matches = await getMyMatches();

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

        {/* 参加設定 */}
        <div className="mb-4">
          <TeaTimeToggle initialEnabled={setting?.is_enabled ?? false} />
        </div>

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
            <p className="text-xs text-[#a3a3a3] mt-1">参加をONにしてお待ちください</p>
          </div>
        )}
      </main>
    </div>
  );
}
