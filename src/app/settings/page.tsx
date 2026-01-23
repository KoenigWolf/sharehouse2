import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { TeaTimeToggle } from "@/components/tea-time-toggle";
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
    <div className="min-h-screen bg-[#fafaf8]">
      <Header />
      <main className="container mx-auto px-4 py-4 max-w-3xl space-y-6">
        <ProfileEditForm profile={profile as Profile} />

        {/* ティータイム設定 */}
        <div className="space-y-3">
          <h2 className="text-sm text-[#737373] tracking-wide">ティータイム</h2>
          <TeaTimeToggle initialEnabled={teaTimeSetting?.is_enabled ?? false} />
          <p className="text-[11px] text-[#a3a3a3]">
            ONにすると、毎週ランダムに住民とマッチングされます
          </p>
        </div>
      </main>
    </div>
  );
}
