import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { Profile } from "@/domain/profile";
import { getTeaTimeSetting } from "@/lib/tea-time/actions";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function SettingsPage() {
  const t = await getServerTranslator();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // プロフィールとティータイム設定を並列取得
  const [profileResult, teaTimeSetting] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getTeaTimeSetting(user.id),
  ]);

  let profile = profileResult.data;

  if (!profile) {
    const userName =
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      t("auth.defaultName");
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        name: userName,
        room_number: null,
        bio: null,
        avatar_url: null,
        interests: [],
        move_in_date: null,
      })
      .select()
      .single();
    profile = newProfile;
  }

  if (!profile) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Header />
      <main className="flex-1 pb-20 sm:pb-0 container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-2xl">
        <ProfileEditForm
          profile={profile as Profile}
          initialTeaTimeEnabled={teaTimeSetting?.is_enabled ?? false}
        />
      </main>
      {/* フッター (デスクトップのみ) */}
      <footer className="hidden sm:block py-6">
        <p className="text-xs text-[#a3a3a3] text-center">Share House</p>
      </footer>
      {/* モバイルナビゲーション */}
      <MobileNav />
    </div>
  );
}
