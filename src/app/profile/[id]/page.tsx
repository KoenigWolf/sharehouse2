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
    // モックユーザーは部屋番号に基づいて参加状態を決定（奇数部屋が参加）
    const roomNum = parseInt(profile?.room_number || "0", 10);
    teaTimeEnabled = roomNum % 2 === 1;
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
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Header />

      <main className="flex-1 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
          <ProfileDetail
            profile={profile}
            isOwnProfile={isOwnProfile}
            teaTimeEnabled={teaTimeEnabled}
          />
        </div>
      </main>

      <footer className="py-6 mt-auto">
        <p className="text-xs text-[#a3a3a3] text-center">Share House Portal</p>
      </footer>
    </div>
  );
}
