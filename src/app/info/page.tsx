import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { getGarbageSchedule, getUpcomingDuties } from "@/lib/garbage/actions";
import { getSharedInfo } from "@/lib/shared-info/actions";
import { isCurrentUserAdmin } from "@/lib/admin/check";
import { InfoPageContent } from "@/components/info-page-content";
import { BlurredPageContent } from "@/components/blurred-page-content";
import { getCachedUser } from "@/lib/supabase/cached-queries";
import type { GarbageDutyWithProfile } from "@/domain/garbage";
import type { SharedInfo } from "@/domain/shared-info";

export default async function InfoPage() {
  const { user } = await getCachedUser();
  const isBlurred = !user;

  // プライバシー保護: 未認証ユーザーには実データを渡さない
  if (isBlurred) {
    const mockSchedule = [
      { id: "mock-1", garbage_type: "可燃ゴミ", day_of_week: 1, notes: null, display_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "mock-2", garbage_type: "資源ゴミ", day_of_week: 4, notes: null, display_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    const mockDuties: GarbageDutyWithProfile[] = [];
    const mockSharedInfos: SharedInfo[] = [];

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pb-20 sm:pb-12">
          <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-5xl">
            <BlurredPageContent isBlurred={isBlurred}>
              <InfoPageContent
                schedule={mockSchedule}
                duties={mockDuties}
                sharedInfos={mockSharedInfos}
                isAdmin={false}
                currentUserId={undefined}
              />
            </BlurredPageContent>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  const [schedule, duties, sharedInfos, isAdmin] = await Promise.all([
    getGarbageSchedule(),
    getUpcomingDuties(),
    getSharedInfo(),
    isCurrentUserAdmin(),
  ]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-5xl">
          <InfoPageContent
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
