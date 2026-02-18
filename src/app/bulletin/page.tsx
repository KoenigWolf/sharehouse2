import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { BulletinBoard } from "@/components/bulletin-board";
import { BlurredPageContent } from "@/components/blurred-page-content";
import { getBulletinsPaginated } from "@/lib/bulletin/actions";
import { getCachedUser } from "@/lib/supabase/cached-queries";
import { logError } from "@/lib/errors";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export const dynamic = "force-dynamic";

export default async function BulletinPage() {
  const { user, supabase } = await getCachedUser();
  const isBlurred = !user;

  const bulletinsResult = await getBulletinsPaginated();

  let currentUserProfile: { name: string; nickname: string | null; avatar_url: string | null; room_number: string | null } | undefined;
  if (user) {
    const profileResult = await supabase
      .from("profiles")
      .select("name, nickname, avatar_url, room_number")
      .eq("id", user.id)
      .single();

    if (profileResult.error) {
      logError(profileResult.error, { action: "BulletinPage:fetchProfile", userId: user.id });
    }
    currentUserProfile = profileResult.data ?? undefined;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-4xl">
          <BlurredPageContent isBlurred={isBlurred} totalCount={bulletinsResult.totalCount}>
            <ErrorBoundary>
              <BulletinBoard
                bulletins={bulletinsResult.bulletins}
                currentUserId={user?.id}
                currentUserProfile={currentUserProfile}
                initialCursor={bulletinsResult.nextCursor}
                initialHasMore={bulletinsResult.hasMore}
              />
            </ErrorBoundary>
          </BlurredPageContent>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
