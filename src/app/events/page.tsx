import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { EventsContent } from "@/components/events-content";
import { BlurredPageContent } from "@/components/blurred-page-content";
import { getUpcomingEvents } from "@/lib/events/actions";
import { getCachedUser } from "@/lib/supabase/cached-queries";
import { generateMockEvents } from "@/lib/mock-data";
import { logError } from "@/lib/errors";

interface EventsPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { edit: editEventId } = await searchParams;
  const { user, supabase } = await getCachedUser();
  const isBlurred = !user;

  // プライバシー保護: 未認証ユーザーには実データを渡さない
  if (isBlurred) {
    const todayStr = new Date().toISOString().split("T")[0];
    const { count, error } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("event_date", todayStr);
    if (error) {
      logError(error, { action: "EventsPage:countQuery" });
    }
    const totalCount = count ?? 0;
    const mockEvents = generateMockEvents(totalCount);

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pb-20 sm:pb-12">
          <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-4xl">
            <BlurredPageContent isBlurred={isBlurred} totalCount={totalCount}>
              <EventsContent
                events={mockEvents}
                currentUserId={undefined}
                initialEditEventId={undefined}
              />
            </BlurredPageContent>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  const events = await getUpcomingEvents();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-4xl">
          <EventsContent
            events={events}
            currentUserId={user.id}
            initialEditEventId={editEventId}
          />
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
