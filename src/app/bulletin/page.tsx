import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { BulletinBoard } from "@/components/bulletin-board";
import { getBulletins } from "@/lib/bulletin/actions";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function BulletinPage() {
  const t = await getServerTranslator();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const bulletins = await getBulletins();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl font-light text-slate-900 tracking-wide">
              {t("bulletin.title")}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-medium">{t("bulletin.subtitle")}</p>
          </div>

          <BulletinBoard
            bulletins={bulletins}
            currentUserId={user.id}
          />
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
