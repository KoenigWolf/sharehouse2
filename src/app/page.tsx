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
  const profiles = dbProfiles && dbProfiles.length > 0 ? dbProfiles : mockProfiles;
  const isUsingMockData = !dbProfiles || dbProfiles.length === 0;

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Header />
      <main className="container mx-auto px-4 py-4">
        {/* ティータイム通知 */}
        {latestMatch && (
          <div className="mb-4">
            <TeaTimeNotification match={latestMatch} />
          </div>
        )}

        {/* 開発用モックデータ通知 */}
        {isUsingMockData && (
          <div className="mb-3 px-3 py-2 border border-dashed border-[#d4d4d4] bg-[#fafaf8] inline-block">
            <p className="text-[11px] text-[#737373]">開発モード: サンプルデータ表示中</p>
          </div>
        )}

        <ResidentsGrid
          profiles={profiles || []}
          currentUserId={user.id}
        />
      </main>
    </div>
  );
}
