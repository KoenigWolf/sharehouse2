import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProfileEditForm } from "@/components/profile-edit-form";
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
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
          <ProfileEditForm
            profile={profile as Profile}
            initialTeaTimeEnabled={teaTimeSetting?.is_enabled ?? false}
          />
        </div>
      </main>

      <footer className="py-6 mt-auto">
        <p className="text-xs text-[#a3a3a3] text-center">Share House Portal</p>
      </footer>
    </div>
  );
}
