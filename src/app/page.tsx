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

  const dbProfiles = (profilesResult.data as Profile[]) || [];

  // 登録済みユーザーの部屋番号を取得
  const registeredRoomNumbers = new Set(
    dbProfiles.filter((p) => p.room_number).map((p) => p.room_number)
  );

  // 登録済みユーザーがいない部屋のモックデータを取得
  const remainingMockProfiles = mockProfiles.filter(
    (mock) => !registeredRoomNumbers.has(mock.room_number)
  );

  // 登録済みユーザー + 空き部屋のモックデータを結合
  const profiles = [...dbProfiles, ...remainingMockProfiles];
  const mockCount = remainingMockProfiles.length;

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* ティータイム通知 */}
          {latestMatch && (
            <div className="mb-6">
              <TeaTimeNotification match={latestMatch} />
            </div>
          )}

          {/* 登録状況 */}
          {mockCount > 0 && (
            <p className="text-xs text-[#a3a3a3] mb-6">
              登録済み {dbProfiles.length}人 / 未登録 {mockCount}部屋
            </p>
          )}

          {/* 住民グリッド */}
          <ResidentsGrid profiles={profiles} currentUserId={user.id} />
        </div>
      </main>

      {/* フッター */}
      <footer className="py-6 mt-auto">
        <p className="text-xs text-[#a3a3a3] text-center">Share House Portal</p>
      </footer>
    </div>
  );
}
