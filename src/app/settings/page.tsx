import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
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

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/profile/${user.id}`}
              className="text-[11px] tracking-wide text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("myPage.backToMyPage")}
            </Link>
            <h1 className="text-lg text-foreground tracking-wide font-light mt-4">
              {t("settings.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("settings.description")}
            </p>
          </div>

          {/* Settings Sections */}
          <div className="space-y-12">
            {/* Appearance */}
            <ThemeSettings />

            {/* Language */}
            <LanguageSettings />

            {/* Notifications */}
            <NotificationSettings
              initialTeaTimeEnabled={teaTimeSetting?.is_enabled ?? false}
              initialNotificationSettings={notificationSettings}
            />

            {/* Account */}
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
