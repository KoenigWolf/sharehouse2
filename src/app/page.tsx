import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { ResidentsGrid } from "@/components/residents-grid";
import { TeaTimeNotification } from "@/components/tea-time-notification";
import { getLatestScheduledMatch } from "@/lib/tea-time/actions";
import { Profile } from "@/domain/profile";
import { mockProfiles } from "@/lib/mock-data";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function Home() {
  const t = await getServerTranslator();
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

  const registeredRoomNumbers = new Set(
    dbProfiles.filter((p) => p.room_number).map((p) => p.room_number)
  );

  const remainingMockProfiles = mockProfiles.filter(
    (mock) => !registeredRoomNumbers.has(mock.room_number)
  );

  const profiles = [...dbProfiles, ...remainingMockProfiles];
  const mockCount = remainingMockProfiles.length;

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8">
          {latestMatch && (
            <div className="mb-5 sm:mb-6">
              <TeaTimeNotification match={latestMatch} />
            </div>
          )}

          {mockCount > 0 && (
            <p className="text-xs text-[#a3a3a3] mb-5 sm:mb-6">
              {t("residents.registeredLabel", { count: dbProfiles.length })} /{" "}
              {t("residents.unregisteredLabel", { count: mockCount })}
            </p>
          )}

          <ResidentsGrid profiles={profiles} currentUserId={user.id} />
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
