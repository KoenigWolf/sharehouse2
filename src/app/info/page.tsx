import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { getWifiInfo } from "@/lib/wifi/actions";
import { getGarbageSchedule, getUpcomingDuties } from "@/lib/garbage/actions";
import { isCurrentUserAdmin } from "@/lib/admin/check";
import { InfoPageContent } from "@/components/info-page-content";

export default async function InfoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [wifiInfos, schedule, duties, isAdmin] = await Promise.all([
    getWifiInfo(),
    getGarbageSchedule(),
    getUpcomingDuties(),
    isCurrentUserAdmin(),
  ]);

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-2xl">
          <InfoPageContent
            wifiInfos={wifiInfos}
            schedule={schedule}
            duties={duties}
            isAdmin={isAdmin}
            currentUserId={user.id}
          />
        </div>
      </main>

      {/* フッター (デスクトップのみ) */}
      <footer className="hidden sm:block py-6 mt-auto">
        <p className="text-xs text-[#a3a3a3] text-center">Share House</p>
      </footer>

      {/* モバイルナビゲーション */}
      <MobileNav />
    </div>
  );
}
