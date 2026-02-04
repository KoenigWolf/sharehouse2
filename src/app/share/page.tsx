import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { ShareContent } from "@/components/share-content";
import { getShareItems } from "@/lib/share/actions";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function SharePage() {
  const t = await getServerTranslator();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const shareItems = await getShareItems();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-4xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl text-[#18181b] tracking-wide font-light">
              {t("share.title")}
            </h1>
            <p className="text-xs text-[#a1a1aa] mt-1">
              {t("share.subtitle")}
            </p>
          </div>

          <ShareContent
            items={shareItems}
            currentUserId={user.id}
          />
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
