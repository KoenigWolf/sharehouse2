import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronLeft } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { Spinner } from "@/components/ui/spinner";
import { getTeaTimeSetting } from "@/lib/tea-time/actions";
import { getNotificationSettings } from "@/lib/notifications/actions";
import { getServerTranslator } from "@/lib/i18n/server";

const ThemeSettings = dynamic(
  () => import("@/components/theme-settings").then((m) => m.ThemeSettings),
  { loading: () => <div className="flex justify-center py-10"><Spinner variant="dark" /></div> },
);

const NotificationSettings = dynamic(
  () => import("@/components/settings/notification-settings").then((m) => m.NotificationSettings),
  { loading: () => <div className="flex justify-center py-10"><Spinner variant="dark" /></div> },
);

const LanguageSettings = dynamic(
  () => import("@/components/settings/language-settings").then((m) => m.LanguageSettings),
  { loading: () => <div className="flex justify-center py-10"><Spinner variant="dark" /></div> },
);

const AccountSettings = dynamic(
  () => import("@/components/account-settings").then((m) => m.AccountSettings),
  { loading: () => <div className="flex justify-center py-10"><Spinner variant="dark" /></div> },
);

export default async function SettingsPage() {
  const supabase = await createClient();
  const t = await getServerTranslator();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [teaTimeSetting, notificationSettings] = await Promise.all([
    getTeaTimeSetting(user.id),
    getNotificationSettings(),
  ]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-24 sm:pb-0">
        <div className="container mx-auto px-5 sm:px-8 py-8 sm:py-13 max-w-2xl">
          {/* Header section with golden ratio spacing */}
          <div className="mb-13">
            <Link
              href={`/profile/${user.id}`}
              className="inline-flex items-center gap-1.5 h-10 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              {t("myPage.backToMyPage")}
            </Link>

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mt-5">
              {t("settings.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {t("settings.description")}
            </p>
          </div>

          {/* Settings sections with golden ratio spacing (21→34→55) */}
          <div className="space-y-13">
            <ThemeSettings />

            <LanguageSettings />

            <NotificationSettings
              initialTeaTimeEnabled={teaTimeSetting?.is_enabled ?? false}
              initialNotificationSettings={notificationSettings}
            />

            <AccountSettings
              userEmail={user.email}
              hasPassword={user.app_metadata?.providers?.includes("email") ?? false}
            />
          </div>
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
