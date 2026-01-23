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
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-lg">
          {/* ヘッダー */}
          <div className="flex items-baseline justify-between mb-6">
            <h1 className="text-xl text-[#1a1a1a] tracking-wide font-light">
              Tea Time
            </h1>
            <span className="text-xs text-[#a3a3a3]">ランダムマッチング</span>
          </div>

          {/* 参加状況 */}
          <Link href="/settings" className="block mb-6 group">
            <div className="bg-white border border-[#e5e5e5] p-4 hover:border-[#1a1a1a] transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#1a1a1a]">
                    {isEnabled ? "参加中" : "不参加"}
                  </p>
                  <p className="text-[10px] text-[#a3a3a3] mt-1">
                    {isEnabled
                      ? "マッチング対象です"
                      : "設定で参加をONにできます"}
                  </p>
                </div>
                <span className="text-xs text-[#a3a3a3] group-hover:text-[#737373] transition-colors">
                  設定 →
                </span>
              </div>
            </div>
          </Link>

          {/* 新しいマッチ */}
          {scheduledMatches.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xs text-[#a3a3a3] tracking-wide mb-3">
                今週のマッチ
              </h2>
              <div className="space-y-3">
                {scheduledMatches.map((match) => (
                  <TeaTimeMatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}

          {/* 過去のマッチ */}
          {pastMatches.length > 0 && (
            <section>
              <h2 className="text-xs text-[#a3a3a3] tracking-wide mb-3">
                履歴
              </h2>
              <div className="space-y-2">
                {pastMatches.map((match) => (
                  <TeaTimeMatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}

          {/* マッチがない場合 */}
          {matches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-[#737373]">まだマッチがありません</p>
              {isEnabled ? (
                <p className="text-xs text-[#a3a3a3] mt-2">
                  次のマッチングをお待ちください
                </p>
              ) : (
                <Link
                  href="/settings"
                  className="inline-block mt-3 px-4 py-2 text-xs text-[#737373] border border-[#e5e5e5] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
                >
                  参加をONにする
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 mt-auto">
        <p className="text-xs text-[#a3a3a3] text-center">Share House Portal</p>
      </footer>
    </div>
  );
}
