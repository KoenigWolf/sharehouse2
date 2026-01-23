import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { Profile } from "@/types/profile";

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

  // 自分のプロフィール以外は編集不可
  if (user.id !== id) {
    redirect(`/profile/${id}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-purple-50 to-cyan-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <ProfileEditForm profile={profile as Profile} />
      </main>
    </div>
  );
}
