import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { EventsContent } from "@/components/events-content";
import { BlurredPageContent } from "@/components/blurred-page-content";
import { getUpcomingEvents } from "@/lib/events/actions";
import { getCachedUser } from "@/lib/supabase/cached-queries";

interface EventsPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { edit: editEventId } = await searchParams;
  const { user } = await getCachedUser();
  const events = await getUpcomingEvents();
  const isBlurred = !user;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-4 max-w-4xl">
          <BlurredPageContent isBlurred={isBlurred} totalCount={events.length}>
            <EventsContent
              events={events}
              currentUserId={user?.id}
              initialEditEventId={isBlurred ? undefined : editEventId}
            />
          </BlurredPageContent>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
