import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { getWifiInfo } from "@/lib/wifi/actions";
import { getGarbageSchedule, getUpcomingDuties } from "@/lib/garbage/actions";
import { getSharedInfo } from "@/lib/shared-info/actions";
import { isCurrentUserAdmin } from "@/lib/admin/check";
import { InfoPageContent } from "@/components/info-page-content";
import { BlurredPageContent } from "@/components/blurred-page-content";
import { getCachedUser } from "@/lib/supabase/cached-queries";

export default async function InfoPage() {
  const { user } = await getCachedUser();
  const isBlurred = !user;

  const [wifiInfos, schedule, duties, sharedInfos, isAdmin] = await Promise.all([
    getWifiInfo(),
    getGarbageSchedule(),
    getUpcomingDuties(),
    getSharedInfo(),
    user ? isCurrentUserAdmin() : false,
  ]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-5xl">
          <BlurredPageContent isBlurred={isBlurred}>
            <InfoPageContent
              wifiInfos={wifiInfos}
              schedule={schedule}
              duties={duties}
              sharedInfos={sharedInfos}
              isAdmin={isAdmin}
              currentUserId={user?.id}
            />
          </BlurredPageContent>
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
