import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { ShareContent } from "@/components/share-content";
import { BlurredPageContent } from "@/components/blurred-page-content";
import { getShareItems } from "@/lib/share/actions";
import { getCachedUser } from "@/lib/supabase/cached-queries";
import { generateMockShareItems } from "@/lib/mock-data";
import { logError } from "@/lib/errors";

export default async function SharePage() {
  const { user, supabase } = await getCachedUser();
  const isBlurred = !user;

  // プライバシー保護: 未認証ユーザーには実データを渡さない
  if (isBlurred) {
    const { count, error } = await supabase
      .from("share_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "available");
    if (error) {
      logError(error, { action: "SharePage:countQuery" });
    }
    const totalCount = count ?? 0;
    const mockItems = generateMockShareItems(totalCount);

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pb-20 sm:pb-12">
          <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-4xl">
            <BlurredPageContent isBlurred={isBlurred} totalCount={totalCount}>
              <ShareContent items={mockItems} currentUserId={undefined} />
            </BlurredPageContent>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  const shareItems = await getShareItems();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-4xl">
          <ShareContent items={shareItems} currentUserId={user.id} />
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
