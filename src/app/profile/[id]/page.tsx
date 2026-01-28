import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { ProfileDetail } from "@/components/profile-detail";
import { Profile } from "@/domain/profile";
import { mockProfiles } from "@/lib/mock-data";
import { getTeaTimeSetting } from "@/lib/tea-time/actions";
import { getRoomPhotos } from "@/lib/room-photos/actions";
import { validateId } from "@/lib/security/validation";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  let validatedId = id;
  try {
    validatedId = validateId(id, "ID");
  } catch {
    notFound();
  }
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profile: Profile | null = null;
  let teaTimeEnabled = false;
  let roomPhotos: Awaited<ReturnType<typeof getRoomPhotos>> = [];

  if (validatedId.startsWith("mock-")) {
    profile = mockProfiles.find((p) => p.id === validatedId) || null;
    // モックユーザーは部屋番号に基づいて参加状態を決定（奇数部屋が参加）
    const roomNum = parseInt(profile?.room_number || "0", 10);
    teaTimeEnabled = roomNum % 2 === 1;
  } else {
    const [profileResult, teaTimeSetting, photos] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", validatedId).single(),
      getTeaTimeSetting(validatedId),
      getRoomPhotos(validatedId),
    ]);
    profile = profileResult.data as Profile | null;
    teaTimeEnabled = teaTimeSetting?.is_enabled ?? false;
    roomPhotos = photos;
  }

  if (!profile) {
    notFound();
  }

  const isOwnProfile = user.id === profile.id;

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Header />

      <main className="flex-1 flex items-center pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-2xl">
          <ProfileDetail
            profile={profile}
            isOwnProfile={isOwnProfile}
            teaTimeEnabled={teaTimeEnabled}
            roomPhotos={roomPhotos}
          />
        </div>
      </main>

      <Footer />

      {/* モバイルナビゲーション */}
      <MobileNav />
    </div>
  );
}
