import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { FloorPlanContent } from "@/components/floor-plan-content";
import { BlurredPageContent } from "@/components/blurred-page-content";
import { getProfilesWithMock, getPublicProfilesWithMock } from "@/lib/residents/queries";
import { getCachedUser } from "@/lib/supabase/cached-queries";
import { mockProfiles } from "@/lib/mock-data";

export default async function FloorPlanPage() {
  const { user, supabase } = await getCachedUser();
  const isBlurred = !user;

  // プライバシー保護: 未認証ユーザーには実データを渡さない
  if (isBlurred) {
    const { profiles: publicTeasers } = await getPublicProfilesWithMock(supabase);
    const teaserProfiles = mockProfiles.slice(0, Math.min(publicTeasers.length, 12));

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pb-20 sm:pb-12">
          <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-4xl">
            <BlurredPageContent isBlurred={isBlurred} totalCount={publicTeasers.length}>
              <FloorPlanContent profiles={teaserProfiles} currentUserId={undefined} />
            </BlurredPageContent>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  const { profiles } = await getProfilesWithMock(supabase, "room_number");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-4xl">
          <FloorPlanContent profiles={profiles} currentUserId={user.id} />
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
