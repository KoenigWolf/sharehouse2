import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { FloorPlanContent } from "@/components/floor-plan-content";
import { getServerTranslator } from "@/lib/i18n/server";
import { getProfilesWithMock } from "@/lib/residents/queries";
import { getCachedUser } from "@/lib/supabase/cached-queries";

export default async function FloorPlanPage() {
  const t = await getServerTranslator();
  const { user, supabase } = await getCachedUser();

  if (!user) {
    redirect("/login");
  }

  const { profiles } = await getProfilesWithMock(supabase, "room_number");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-4xl">
          <div className="mb-8">
            <h1 className="heading-page">
              {t("floorPlan.title")}
            </h1>
            <p className="subtitle mt-2">
              {t("floorPlan.subtitle")}
            </p>
          </div>

          <FloorPlanContent profiles={profiles} currentUserId={user.id} />
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
