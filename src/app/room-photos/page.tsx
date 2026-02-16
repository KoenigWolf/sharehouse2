import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { Spinner } from "@/components/ui/spinner";
import { getAllRoomPhotos } from "@/lib/room-photos/actions";
import { getCachedUser } from "@/lib/supabase/cached-queries";

const RoomPhotosGallery = dynamic(
  () => import("@/components/room-photos-gallery").then((m) => m.RoomPhotosGallery),
  { loading: () => <div className="flex justify-center py-20"><Spinner size="lg" variant="dark" /></div> },
);

export default async function RoomPhotosPage() {
  const { user } = await getCachedUser();

  if (!user) {
    redirect("/login");
  }

  const photos = await getAllRoomPhotos();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-5xl">
          <RoomPhotosGallery photos={photos} />
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
