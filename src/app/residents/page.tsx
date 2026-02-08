import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { ResidentsGrid } from "@/components/residents-grid";
import { PublicTeaserGrid } from "@/components/public-teaser/public-teaser-grid";
import { TeaTimeNotification } from "@/components/tea-time-notification";
import { getLatestScheduledMatch } from "@/lib/tea-time/actions";
import { getServerTranslator } from "@/lib/i18n/server";
import { getProfilesWithMock, getPublicProfilesWithMock } from "@/lib/residents/queries";

export const dynamic = "force-dynamic";

export default async function ResidentsPage() {
  const t = await getServerTranslator();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const [{ profiles, dbProfiles }, latestMatch] = await Promise.all([
      getProfilesWithMock(supabase),
      getLatestScheduledMatch(),
    ]);

    const mockCount = profiles.length - dbProfiles.length;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1 pb-20 sm:pb-0">
          <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8">
            {latestMatch && (
              <div className="mb-6">
                <TeaTimeNotification match={latestMatch} />
              </div>
            )}

            {mockCount > 0 && (
              <p className="text-xs text-muted-foreground mb-5 sm:mb-6">
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

  // 登録を促すため、未認証ユーザーにも residents_public_teaser 経由で最小限の住民情報を見せる
  const { profiles } = await getPublicProfilesWithMock(supabase);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8">
          <PublicTeaserGrid profiles={profiles} />
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
