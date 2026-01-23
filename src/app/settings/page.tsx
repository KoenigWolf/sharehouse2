import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { Profile } from "@/types/profile";
import { getTeaTimeSetting } from "@/lib/tea-time/actions";

export default async function SettingsPage() {
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
    const userName = user.user_metadata?.name || user.email?.split("@")[0] || "ユーザー";
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
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        <ProfileEditForm
          profile={profile as Profile}
          initialTeaTimeEnabled={teaTimeSetting?.is_enabled ?? false}
        />
      </main>
      <footer className="py-6">
        <p className="text-xs text-[#a3a3a3] text-center">Share House</p>
      </footer>
    </div>
  );
}
