import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { FloorPlanContent } from "@/components/floor-plan-content";
import { BlurredPageContent } from "@/components/blurred-page-content";
import { getProfilesWithMock } from "@/lib/residents/queries";
import { getCachedUser } from "@/lib/supabase/cached-queries";

export default async function FloorPlanPage() {
  const { user, supabase } = await getCachedUser();
  const { profiles } = await getProfilesWithMock(supabase, "room_number");
  const isBlurred = !user;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-4xl">
          <BlurredPageContent isBlurred={isBlurred} totalCount={profiles.length}>
            <FloorPlanContent profiles={profiles} currentUserId={user?.id} />
          </BlurredPageContent>
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
