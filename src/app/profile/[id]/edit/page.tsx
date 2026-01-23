import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { TeaTimeToggle } from "@/components/tea-time-toggle";
import { Profile } from "@/types/profile";
import { getTeaTimeSetting } from "@/lib/tea-time/actions";

interface ProfileEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfileEditPage({ params }: ProfileEditPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // モックデータは編集不可
  if (id.startsWith("mock-")) {
    redirect(`/profile/${id}`);
  }

  // 自分のプロフィール以外は編集不可
  if (user.id !== id) {
    redirect(`/profile/${id}`);
  }

  const [profileResult, teaTimeSetting] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    getTeaTimeSetting(id),
  ]);

  const profile = profileResult.data;

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Header />
      <main className="container mx-auto px-6 py-10 max-w-2xl space-y-6">
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
