import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { FloorPlanContent } from "@/components/floor-plan-content";
import { getServerTranslator } from "@/lib/i18n/server";
import { Profile } from "@/domain/profile";
import { mockProfiles } from "@/lib/mock-data";

export default async function FloorPlanPage() {
  const t = await getServerTranslator();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, name, nickname, room_number, avatar_url, move_in_date, occupation")
    .order("room_number");

  const dbProfiles = (data as Profile[]) || [];

  const registeredRoomNumbers = new Set(
    dbProfiles.filter((p) => p.room_number).map((p) => p.room_number)
  );

  const remainingMockProfiles = mockProfiles.filter(
    (mock) => !registeredRoomNumbers.has(mock.room_number)
  );

  const profiles = [...dbProfiles, ...remainingMockProfiles];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-3xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl text-[#18181b] tracking-wide font-light">
              {t("floorPlan.title")}
            </h1>
            <p className="text-xs text-[#a1a1aa] mt-1">
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
