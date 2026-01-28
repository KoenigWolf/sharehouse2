import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { RoomPhotosGallery } from "@/components/room-photos-gallery";
import { getAllRoomPhotos } from "@/lib/room-photos/actions";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function RoomPhotosPage() {
  const t = await getServerTranslator();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const photos = await getAllRoomPhotos();

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-4xl">
          {/* ヘッダー */}
          <div className="flex items-baseline justify-between mb-5 sm:mb-6">
            <h1 className="text-xl text-[#1a1a1a] tracking-wide font-light">
              {t("roomPhotos.title")}
            </h1>
            <span className="text-xs text-[#a3a3a3]">
              {t("roomPhotos.subtitle")}
            </span>
          </div>

          {/* ギャラリー */}
          <RoomPhotosGallery photos={photos} />
        </div>
      </main>

      {/* フッター (デスクトップのみ) */}
      <footer className="hidden sm:block py-6 mt-auto">
        <p className="text-xs text-[#a3a3a3] text-center">Share House</p>
      </footer>

      {/* モバイルナビゲーション */}
      <MobileNav />
    </div>
  );
}
