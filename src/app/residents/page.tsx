import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { ResidentsGrid } from "@/components/residents-grid";
import { PublicTeaserGrid } from "@/components/public-teaser/public-teaser-grid";
import { TeaTimeNotification } from "@/components/tea-time-notification";
import { getLatestScheduledMatch } from "@/lib/tea-time/actions";
import { getProfilesWithMock, getPublicProfilesWithMock } from "@/lib/residents/queries";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export const dynamic = "force-dynamic";

export default async function ResidentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const [{ profiles }, latestMatch] = await Promise.all([
      getProfilesWithMock(supabase),
      getLatestScheduledMatch(),
    ]);

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1 pb-20 sm:pb-0">
          <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-4 pb-4">
            {latestMatch && (
              <div className="mb-4">
                <TeaTimeNotification match={latestMatch} />
              </div>
            )}

            <ErrorBoundary>
              <ResidentsGrid profiles={profiles} currentUserId={user.id} />
            </ErrorBoundary>
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
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-4 pb-4">
          <ErrorBoundary>
            <PublicTeaserGrid profiles={profiles} />
          </ErrorBoundary>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
