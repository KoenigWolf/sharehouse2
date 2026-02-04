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

            <ResidentsGrid profiles={profiles} currentUserId={user.id} />
          </div>
        </main>

        <Footer />
        <MobileNav />
      </div>
    );
  }

  // 未認証でも「住民がいる」ことを伝えて登録を促すため、
  // residents_public_teaser ビュー経由で名前先頭1文字・年代・業種のみ返す。
  // avatar_url や nickname 全文はビューに含めておらず DevTools でも取得不可。
  const { profiles } = await getPublicProfilesWithMock(supabase);

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
