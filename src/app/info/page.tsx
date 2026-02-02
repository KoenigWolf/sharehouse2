import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { getWifiInfo } from "@/lib/wifi/actions";
import { getGarbageSchedule, getUpcomingDuties } from "@/lib/garbage/actions";
import { getSharedInfo } from "@/lib/shared-info/actions";
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

  const [wifiInfos, schedule, duties, sharedInfos, isAdmin] = await Promise.all([
    getWifiInfo(),
    getGarbageSchedule(),
    getUpcomingDuties(),
    getSharedInfo(),
    isCurrentUserAdmin(),
  ]);

  return (
    <div className="min-h-screen bg-[#f5f6f4] flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-2xl">
          <InfoPageContent
            wifiInfos={wifiInfos}
            schedule={schedule}
            duties={duties}
            sharedInfos={sharedInfos}
            isAdmin={isAdmin}
            currentUserId={user.id}
          />
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
