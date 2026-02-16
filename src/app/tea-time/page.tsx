import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings, ChevronRight, Coffee } from "lucide-react";
import { ICON_SIZE, ICON_STROKE } from "@/lib/constants/icons";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { TeaTimeMatchCard } from "@/components/tea-time-match-card";
import { getTeaTimeSetting, getMyMatches } from "@/lib/tea-time/actions";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCachedUser } from "@/lib/supabase/cached-queries";

export default async function TeaTimePage() {
  const t = await getServerTranslator();
  const { user } = await getCachedUser();

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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-lg">
          <Link href="/settings" className="block mb-10 group active:scale-[0.99] transition-all">
            <div className="premium-surface rounded-3xl p-6 border-border/50 flex items-center justify-between group-hover:shadow-xl transition-all ring-1 ring-border/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center border border-border shadow-inner group-hover:text-brand-500 transition-colors">
                  <Settings size={ICON_SIZE.xl} strokeWidth={ICON_STROKE.medium} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground group-hover:text-brand-500 transition-colors">
                    {isEnabled ? t("teaTime.participating") : t("teaTime.notParticipating")}
                  </p>
                  <p className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">
                    {isEnabled
                      ? t("teaTime.matchingTarget")
                      : t("teaTime.enableInSettings")}
                  </p>
                </div>
              </div>
              <div className="bg-background w-10 h-10 rounded-full flex items-center justify-center border border-border text-muted-foreground/70 group-hover:text-brand-500 group-hover:translate-x-1 transition-all shadow-inner">
                <ChevronRight size={ICON_SIZE.md} strokeWidth={ICON_STROKE.bold} aria-hidden="true" />
              </div>
            </div>
          </Link>

          {scheduledMatches.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-brand-500 rounded-full" />
                <h2 className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                  {t("teaTime.thisWeeksMatch")}
                </h2>
              </div>
              <div className="space-y-4">
                {scheduledMatches.map((match) => (
                  <TeaTimeMatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}

          {pastMatches.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-muted-foreground/30 rounded-full" />
                <h2 className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                  {t("teaTime.history")}
                </h2>
              </div>
              <div className="grid gap-3">
                {pastMatches.map((match) => (
                  <TeaTimeMatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}

          {matches.length === 0 && (
            <div className="text-center py-20 premium-surface rounded-3xl border-border/50 ring-1 ring-border/50">
              <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center border border-border shadow-inner mx-auto mb-6 text-muted-foreground/70">
                <Coffee size={28} strokeWidth={ICON_STROKE.normal} aria-hidden="true" />
              </div>
              <p className="text-sm font-bold text-foreground">{t("teaTime.noMatches")}</p>
              {isEnabled ? (
                <p className="text-[11px] font-medium text-muted-foreground mt-2 italic">
                  {t("teaTime.waitForNextMatch")}
                </p>
              ) : (
                <Link
                  href="/settings"
                  className="inline-block mt-6 px-8 py-3.5 rounded-2xl text-xs font-bold bg-brand-500 text-white shadow-lg shadow-brand-100 hover:bg-brand-700 hover:shadow-brand-200 active:scale-[0.98] transition-all"
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
