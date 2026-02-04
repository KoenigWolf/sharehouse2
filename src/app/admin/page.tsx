import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { AdminUserList } from "@/components/admin-user-list";
import { getAllProfilesForAdmin } from "@/lib/admin/actions";
import { isCurrentUserAdmin } from "@/lib/admin/check";
import { createClient } from "@/lib/supabase/server";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  const [profiles, t] = await Promise.all([
    getAllProfilesForAdmin(),
    getServerTranslator(),
  ]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-2xl space-y-5">
          <h1 className="text-lg text-[#18181b] tracking-wide font-light">
            {t("admin.title")}
          </h1>
          <p className="text-xs text-[#a1a1aa]">
            {t("admin.userCount", { count: profiles.length })}
          </p>
          <AdminUserList profiles={profiles} currentUserId={user.id} />
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
