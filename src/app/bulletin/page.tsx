import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { BulletinBoard } from "@/components/bulletin-board";
import { getBulletinsPaginated } from "@/lib/bulletin/actions";
import { getCachedUser } from "@/lib/supabase/cached-queries";
import { logError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export default async function BulletinPage() {
  const { user, supabase } = await getCachedUser();

  if (!user) {
    redirect("/login");
  }

  const [bulletinsResult, profileResult] = await Promise.all([
    getBulletinsPaginated(),
    supabase.from("profiles").select("name, nickname, avatar_url, room_number").eq("id", user.id).single(),
  ]);

  if (profileResult.error) {
    logError(profileResult.error, { action: "BulletinPage:fetchProfile", userId: user.id });
  }

  const currentUserProfile = profileResult.data ?? undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-4xl">
          <BulletinBoard
            bulletins={bulletinsResult.bulletins}
            currentUserId={user.id}
            currentUserProfile={currentUserProfile}
            initialCursor={bulletinsResult.nextCursor}
            initialHasMore={bulletinsResult.hasMore}
          />
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
