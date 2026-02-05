import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { ResidentStats } from "@/components/resident-stats";
import { getServerTranslator } from "@/lib/i18n/server";
import { getProfilesWithMock } from "@/lib/residents/queries";

export default async function StatsPage() {
  const t = await getServerTranslator();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ profiles }, teaTimeResult] = await Promise.all([
    getProfilesWithMock(supabase),
    supabase
      .from("tea_time_settings")
      .select("user_id")
      .eq("is_enabled", true),
  ]);

  const teaTimeParticipants = (teaTimeResult.data ?? []).map((row) => row.user_id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl font-light text-slate-900 tracking-wide">
              {t("residents.statsTitle")}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">{t("residents.statsSubtitle")}</p>
          </div>

          <ResidentStats
            profiles={profiles}
            teaTimeParticipants={teaTimeParticipants}
          />
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
