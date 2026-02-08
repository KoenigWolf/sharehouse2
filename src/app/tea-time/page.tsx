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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-lg">
          <div className="flex items-baseline justify-between mb-8">
            <h1 className="text-2xl font-light text-foreground tracking-wide">
              {t("teaTime.title")}
            </h1>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("teaTime.subtitle")}</span>
          </div>

          <Link href="/settings" className="block mb-10 group active:scale-[0.99] transition-all">
            <div className="premium-surface rounded-3xl p-6 border-border/50 flex items-center justify-between group-hover:shadow-xl transition-all ring-1 ring-border/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center border border-border shadow-inner group-hover:text-brand-500 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
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
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
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
