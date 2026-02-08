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

  const adminCount = profiles.filter((p) => p.is_admin).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-4xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl text-foreground tracking-wide font-light">
              {t("admin.title")}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {t("admin.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="premium-surface rounded-2xl p-5">
              <p className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                {t("admin.totalUsers")}
              </p>
              <p className="text-2xl font-bold text-foreground tracking-tight mt-1">
                {profiles.length}
              </p>
            </div>
            <div className="premium-surface rounded-2xl p-5">
              <p className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                {t("admin.adminUsers")}
              </p>
              <p className="text-2xl font-bold text-brand-500 tracking-tight mt-1">
                {adminCount}
              </p>
            </div>
          </div>

          <div className="premium-surface rounded-2xl p-5 sm:p-6">
            <h2 className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground mb-4">
              {t("admin.userList")}
            </h2>
            <AdminUserList profiles={profiles} currentUserId={user.id} />
          </div>
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
