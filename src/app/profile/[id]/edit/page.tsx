import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { RoomPhotoManager } from "@/components/room-photo-manager";
import { AccountSettings } from "@/components/account-settings";
import { Profile } from "@/domain/profile";
import { getTeaTimeSetting } from "@/lib/tea-time/actions";
import { getNotificationSettings } from "@/lib/notifications/actions";
import { getRoomPhotos } from "@/lib/room-photos/actions";
import { validateId } from "@/lib/security/validation";
import { getServerTranslator } from "@/lib/i18n/server";
import { isCurrentUserAdmin } from "@/lib/admin/check";

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

  // 自分以外のプロフィールは管理者のみ編集可能
  const isOwnProfile = user.id === validatedId;
  const isAdmin = !isOwnProfile ? await isCurrentUserAdmin() : false;
  if (!isOwnProfile && !isAdmin) {
    redirect(`/profile/${validatedId}`);
  }

  const t = await getServerTranslator();
  const [profileResult, teaTimeSetting, notificationSettings, roomPhotos] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", validatedId).single(),
    getTeaTimeSetting(validatedId),
    getNotificationSettings(),
    getRoomPhotos(validatedId),
  ]);

  const profile = profileResult.data;

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-2xl space-y-5">
          <Link
            href={`/profile/${validatedId}`}
            className="text-[11px] tracking-wide text-[#a1a1aa] hover:text-[#71717a] transition-colors"
          >
            {isOwnProfile ? t("myPage.backToMyPage") : t("common.back")}
          </Link>
          {!isOwnProfile && (
            <div className="py-2 px-3 border-l-2 border-[#e4e4e7] bg-[#f4f4f5] text-xs text-[#71717a]">
              {t("admin.editingAs", { name: profile.name })}
            </div>
          )}
          <h1 className="text-lg text-[#18181b] tracking-wide font-light">
            {t("profile.editTitle")}
          </h1>
          <ProfileEditForm
            profile={profile as Profile}
            initialTeaTimeEnabled={teaTimeSetting?.is_enabled ?? false}
            initialNotificationSettings={notificationSettings}
            targetUserId={isOwnProfile ? undefined : validatedId}
          />
          <RoomPhotoManager photos={roomPhotos} />
          {isOwnProfile && (
            <AccountSettings
              userEmail={user.email}
              hasPassword={user.app_metadata?.providers?.includes("email") ?? false}
            />
          )}
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
