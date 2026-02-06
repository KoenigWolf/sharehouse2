import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { Spinner } from "@/components/ui/spinner";
import { getAllRoomPhotos } from "@/lib/room-photos/actions";
import { getServerTranslator } from "@/lib/i18n/server";

const RoomPhotosGallery = dynamic(
  () => import("@/components/room-photos-gallery").then((m) => m.RoomPhotosGallery),
  { loading: () => <div className="flex justify-center py-20"><Spinner size="lg" variant="dark" /></div> },
);

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl font-light text-slate-900 tracking-wide">
              {t("roomPhotos.title")}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-medium">
              {t("roomPhotos.subtitle")}
            </p>
          </div>

          <RoomPhotosGallery photos={photos} />
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
