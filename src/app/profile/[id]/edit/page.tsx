import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { RoomPhotoManager } from "@/components/room-photo-manager";
import { Profile } from "@/domain/profile";
import { getTeaTimeSetting } from "@/lib/tea-time/actions";
import { getRoomPhotos } from "@/lib/room-photos/actions";
import { validateId } from "@/lib/security/validation";
import { getServerTranslator } from "@/lib/i18n/server";

interface ProfileEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfileEditPage({ params }: ProfileEditPageProps) {
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

  // モックデータは編集不可
  if (validatedId.startsWith("mock-")) {
    redirect(`/profile/${validatedId}`);
  }

  // 自分のプロフィール以外は編集不可
  if (user.id !== validatedId) {
    redirect(`/profile/${validatedId}`);
  }

  const t = await getServerTranslator();
  const [profileResult, teaTimeSetting, roomPhotos] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", validatedId).single(),
    getTeaTimeSetting(validatedId),
    getRoomPhotos(validatedId),
  ]);

  const profile = profileResult.data;

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-2xl space-y-5">
          <Link
            href={`/profile/${validatedId}`}
            className="inline-flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#1a1a1a] transition-colors"
          >
            <span aria-hidden="true">&larr;</span>
            <span>{t("myPage.backToMyPage")}</span>
          </Link>
          <ProfileEditForm
            profile={profile as Profile}
            initialTeaTimeEnabled={teaTimeSetting?.is_enabled ?? false}
          />
          <RoomPhotoManager photos={roomPhotos} />
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
