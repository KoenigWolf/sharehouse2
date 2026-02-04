import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { ResidentsGrid } from "@/components/residents-grid";
import { TeaTimeNotification } from "@/components/tea-time-notification";
import { getLatestScheduledMatch } from "@/lib/tea-time/actions";
import { getServerTranslator } from "@/lib/i18n/server";
import { getProfilesWithMock, getPublicProfilesWithMock } from "@/lib/residents/queries";

export default async function ResidentsPage() {
  const t = await getServerTranslator();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profilesData;
  let latestMatch = null;

  if (user) {
    [profilesData, latestMatch] = await Promise.all([
      getProfilesWithMock(supabase),
      getLatestScheduledMatch(),
    ]);
  } else {
    // 未認証ユーザー向けチラ見せデータ
    const { profiles } = await getPublicProfilesWithMock(supabase);
    profilesData = { profiles, dbProfiles: [] };
  }

  const { profiles, dbProfiles } = profilesData;
  const mockCount = dbProfiles.length > 0 ? profiles.length - dbProfiles.length : 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8">
          {latestMatch && (
            <div className="mb-6">
              <TeaTimeNotification match={latestMatch} />
            </div>
          )}

          {mockCount > 0 && (
            <p className="text-xs text-slate-400 mb-5 sm:mb-6">
              {t("residents.registeredLabel", { count: dbProfiles.length })} /{" "}
              {t("residents.unregisteredLabel", { count: mockCount })}
            </p>
          )}

          <ResidentsGrid
            profiles={user ? profiles as any : []}
            currentUserId={user?.id || ""}
            isPublicTeaser={!user}
            publicProfiles={!user ? profiles as any : []}
          />
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
