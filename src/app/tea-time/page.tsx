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
      <main className="container mx-auto px-6 py-10 max-w-2xl">
        <div className="mb-8">
          <h2 className="text-xl text-[#1a1a1a] tracking-wide">ティータイム</h2>
          <p className="text-sm text-[#737373] mt-1">
            ランダムマッチで住民と繋がろう
          </p>
        </div>

        {/* 参加設定 */}
        <div className="mb-8">
          <TeaTimeToggle initialEnabled={setting?.is_enabled ?? false} />
        </div>

        {/* 新しいマッチ */}
        {scheduledMatches.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs text-[#737373] tracking-wide mb-4">
              新しいマッチ
            </h3>
            <div className="space-y-4">
              {scheduledMatches.map((match) => (
                <TeaTimeMatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* 過去のマッチ */}
        {pastMatches.length > 0 && (
          <div>
            <h3 className="text-xs text-[#737373] tracking-wide mb-4">
              過去のマッチ
            </h3>
            <div className="space-y-3">
              {pastMatches.map((match) => (
                <TeaTimeMatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* マッチがない場合 */}
        {matches.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-[#f5f5f3] flex items-center justify-center">
              <span className="text-4xl">☕</span>
            </div>
            <p className="text-[#737373]">まだマッチがありません</p>
            <p className="text-sm text-[#a3a3a3] mt-1">
              参加をONにしてお待ちください
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
