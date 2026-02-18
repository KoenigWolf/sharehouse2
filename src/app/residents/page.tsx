import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { ResidentsGrid } from "@/components/residents-grid";
import { TeaserOverlay } from "@/components/public-teaser/teaser-overlay";
import { TeaTimeNotification } from "@/components/tea-time-notification";
import { getLatestScheduledMatch } from "@/lib/tea-time/actions";
import { getProfilesWithMock } from "@/lib/residents/queries";
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

  // 未認証ユーザーにも同じデザインでモザイクをかけた状態で表示
  const { profiles } = await getProfilesWithMock(supabase);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-4 pb-4">
          <div className="space-y-8">
            <div className="relative max-h-[800px] overflow-hidden">
              <ErrorBoundary>
                <ResidentsGrid profiles={profiles} isBlurred />
              </ErrorBoundary>
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
            </div>

            <div className="-mt-24 relative z-10">
              <TeaserOverlay totalCount={profiles.length} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
