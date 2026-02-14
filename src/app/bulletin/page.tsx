import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { BulletinBoard } from "@/components/bulletin-board";
import { getBulletins } from "@/lib/bulletin/actions";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCachedUser } from "@/lib/supabase/cached-queries";
import { logError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export default async function BulletinPage() {
  const t = await getServerTranslator();
  const { user, supabase } = await getCachedUser();

  if (!user) {
    redirect("/login");
  }

  const [bulletins, profileResult] = await Promise.all([
    getBulletins(),
    supabase.from("profiles").select("name, nickname, avatar_url, room_number").eq("id", user.id).single(),
  ]);

  if (profileResult.error) {
    logError(profileResult.error, { action: "BulletinPage:fetchProfile", userId: user.id });
  }

  const currentUserProfile = profileResult.data ?? undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl font-light text-foreground tracking-wide">
              {t("bulletin.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 font-medium">{t("bulletin.subtitle")}</p>
          </div>

          <BulletinBoard
            bulletins={bulletins}
            currentUserId={user.id}
            currentUserProfile={currentUserProfile}
          />
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
