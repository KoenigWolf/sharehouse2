import dynamic from "next/dynamic";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { Spinner } from "@/components/ui/spinner";
import { BlurredPageContent } from "@/components/blurred-page-content";
import { getAllRoomPhotos } from "@/lib/room-photos/actions";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCachedUser } from "@/lib/supabase/cached-queries";
import { generateMockRoomPhotos } from "@/lib/mock-data";
import { logError } from "@/lib/errors";

const RoomPhotosGallery = dynamic(
  () => import("@/components/room-photos-gallery").then((m) => m.RoomPhotosGallery),
  { loading: () => <div className="flex justify-center py-20"><Spinner size="lg" variant="dark" /></div> },
);

export default async function RoomPhotosPage() {
  const t = await getServerTranslator();
  const { user, supabase } = await getCachedUser();
  const isBlurred = !user;

  // プライバシー保護: 未認証ユーザーには実データを渡さない
  if (isBlurred) {
    const { count, error } = await supabase
      .from("room_photos")
      .select("*", { count: "exact", head: true });
    if (error) {
      logError(error, { action: "RoomPhotosPage:countQuery" });
    }
    const totalCount = count ?? 0;
    const mockPhotos = generateMockRoomPhotos(totalCount);

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pb-20 sm:pb-12">
          <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-5xl">
            <h1 id="gallery-title" className="sr-only">
              {t("roomPhotos.title")}
            </h1>
            <BlurredPageContent isBlurred={isBlurred} totalCount={totalCount}>
              <RoomPhotosGallery photos={mockPhotos} />
            </BlurredPageContent>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  const photos = await getAllRoomPhotos();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-5xl">
          <h1 id="gallery-title" className="sr-only">
            {t("roomPhotos.title")}
          </h1>
          <RoomPhotosGallery photos={photos} />
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
