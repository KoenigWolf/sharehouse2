import dynamic from "next/dynamic";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { Spinner } from "@/components/ui/spinner";
import { BlurredPageContent } from "@/components/blurred-page-content";
import { getAllRoomPhotos } from "@/lib/room-photos/actions";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCachedUser } from "@/lib/supabase/cached-queries";

const RoomPhotosGallery = dynamic(
  () => import("@/components/room-photos-gallery").then((m) => m.RoomPhotosGallery),
  { loading: () => <div className="flex justify-center py-20"><Spinner size="lg" variant="dark" /></div> },
);

export default async function RoomPhotosPage() {
  const t = await getServerTranslator();
  const { user } = await getCachedUser();
  const photos = await getAllRoomPhotos();
  const isBlurred = !user;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-5xl">
          <h1 id="gallery-title" className="sr-only">
            {t("roomPhotos.title")}
          </h1>
          <BlurredPageContent isBlurred={isBlurred} totalCount={photos.length}>
            <RoomPhotosGallery photos={photos} />
          </BlurredPageContent>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
