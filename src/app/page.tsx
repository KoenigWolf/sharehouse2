import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { ResidentsGrid } from "@/components/residents-grid";
import { TeaTimeNotification } from "@/components/tea-time-notification";
import { getLatestScheduledMatch } from "@/lib/tea-time/actions";
import { Profile } from "@/types/profile";
import { mockProfiles } from "@/lib/mock-data";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profilesResult, latestMatch] = await Promise.all([
    supabase.from("profiles").select("*").order("name"),
    getLatestScheduledMatch(),
  ]);

  const dbProfiles = profilesResult.data as Profile[] | null;

  // 実データがない場合はモックデータを使用（開発用）
  const profiles = dbProfiles && dbProfiles.length > 0 ? dbProfiles : mockProfiles;
  const isUsingMockData = !dbProfiles || dbProfiles.length === 0;

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Header />
      <main className="container mx-auto px-6 py-10">
        {/* ティータイム通知 */}
        {latestMatch && (
          <div className="mb-8">
            <TeaTimeNotification match={latestMatch} />
          </div>
        )}

        {/* 開発用モックデータ使用中の通知 */}
        {isUsingMockData && (
          <div className="mb-6 p-4 border border-dashed border-[#d4d4d4] bg-[#fafaf8]">
            <p className="text-xs text-[#737373]">
              開発モード: サンプルデータを表示中
            </p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl text-[#1a1a1a] tracking-wide">住民一覧</h2>
          <p className="text-sm text-[#737373] mt-1">
            {profiles?.length || 0}人が住んでいます
          </p>
        </div>

        <ResidentsGrid
          profiles={profiles || []}
          currentUserId={user.id}
        />
      </main>
    </div>
  );
}
