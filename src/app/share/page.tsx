import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { ShareContent } from "@/components/share-content";
import { BlurredPageContent } from "@/components/blurred-page-content";
import { getShareItems } from "@/lib/share/actions";
import { getCachedUser } from "@/lib/supabase/cached-queries";

export default async function SharePage() {
  const { user } = await getCachedUser();
  const shareItems = await getShareItems();
  const isBlurred = !user;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-4xl">
          <BlurredPageContent isBlurred={isBlurred} totalCount={shareItems.length}>
            <ShareContent
              items={shareItems}
              currentUserId={user?.id}
            />
          </BlurredPageContent>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
