import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProfileDetail } from "@/components/profile-detail";
import { Profile } from "@/types/profile";
import { mockProfiles } from "@/lib/mock-data";
import { getTeaTimeSetting } from "@/lib/tea-time/actions";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profile: Profile | null = null;
  let teaTimeEnabled = false;

  if (id.startsWith("mock-")) {
    profile = mockProfiles.find((p) => p.id === id) || null;
    // モックユーザーはランダムで参加状態を設定
    teaTimeEnabled = Math.random() > 0.5;
  } else {
    const [profileResult, teaTimeSetting] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      getTeaTimeSetting(id),
    ]);
    profile = profileResult.data as Profile | null;
    teaTimeEnabled = teaTimeSetting?.is_enabled ?? false;
  }

  if (!profile) {
    notFound();
  }

  const isOwnProfile = user.id === profile.id;

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Header />
      <main className="container mx-auto px-4 py-4 max-w-2xl">
        <ProfileDetail
          profile={profile}
          isOwnProfile={isOwnProfile}
          teaTimeEnabled={teaTimeEnabled}
        />
      </main>
    </div>
  );
}
