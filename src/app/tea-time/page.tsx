import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { TeaTimeMatchCard } from "@/components/tea-time-match-card";
import { getTeaTimeSetting, getMyMatches } from "@/lib/tea-time/actions";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function TeaTimePage() {
  const t = await getServerTranslator();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [setting, matches] = await Promise.all([
    getTeaTimeSetting(user.id),
    getMyMatches(),
  ]);

  const isEnabled = setting?.is_enabled ?? false;
  const scheduledMatches = matches.filter((m) => m.status === "scheduled");
  const pastMatches = matches.filter((m) => m.status !== "scheduled");

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-lg">
          <div className="flex items-baseline justify-between mb-5 sm:mb-6">
            <h1 className="text-xl text-[#1a1a1a] tracking-wide font-light">
              {t("teaTime.title")}
            </h1>
            <span className="text-xs text-[#a3a3a3]">{t("teaTime.subtitle")}</span>
          </div>

          <Link href="/settings" className="block mb-5 sm:mb-6 group active:scale-[0.99] transition-transform">
            <div className="bg-white border border-[#e5e5e5] p-4 hover:border-[#1a1a1a] transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#1a1a1a]">
                    {isEnabled ? t("teaTime.participating") : t("teaTime.notParticipating")}
                  </p>
                  <p className="text-[10px] text-[#a3a3a3] mt-1">
                    {isEnabled
                      ? t("teaTime.matchingTarget")
                      : t("teaTime.enableInSettings")}
                  </p>
                </div>
                <span className="text-xs text-[#a3a3a3] group-hover:text-[#737373] transition-colors">
                  {t("teaTime.goToSettings")} →
                </span>
              </div>
            </div>
          </Link>

          {scheduledMatches.length > 0 && (
            <section className="mb-5 sm:mb-6">
              <h2 className="text-xs text-[#a3a3a3] tracking-wide mb-3">
                {t("teaTime.thisWeeksMatch")}
              </h2>
              <div className="space-y-3">
                {scheduledMatches.map((match) => (
                  <TeaTimeMatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}

          {pastMatches.length > 0 && (
            <section>
              <h2 className="text-xs text-[#a3a3a3] tracking-wide mb-3">
                {t("teaTime.history")}
              </h2>
              <div className="space-y-2">
                {pastMatches.map((match) => (
                  <TeaTimeMatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}

          {matches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-[#737373]">{t("teaTime.noMatches")}</p>
              {isEnabled ? (
                <p className="text-xs text-[#a3a3a3] mt-2">
                  {t("teaTime.waitForNextMatch")}
                </p>
              ) : (
                <Link
                  href="/settings"
                  className="inline-block mt-3 px-5 py-3 text-xs text-[#737373] border border-[#e5e5e5] hover:border-[#1a1a1a] hover:text-[#1a1a1a] active:scale-[0.98] transition-all"
                >
                  {t("teaTime.enableParticipation")}
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
