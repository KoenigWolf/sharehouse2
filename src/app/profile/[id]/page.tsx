import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProfileDetail } from "@/components/profile-detail";
import { Profile } from "@/types/profile";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) {
    notFound();
  }

  const isOwnProfile = user.id === profile.id;

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-purple-50 to-cyan-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <ProfileDetail profile={profile as Profile} isOwnProfile={isOwnProfile} />
      </main>
    </div>
  );
}
