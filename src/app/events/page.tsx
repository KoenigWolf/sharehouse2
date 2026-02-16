import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { EventsContent } from "@/components/events-content";
import { getUpcomingEvents } from "@/lib/events/actions";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCachedUser } from "@/lib/supabase/cached-queries";

interface EventsPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { edit: editEventId } = await searchParams;
  const t = await getServerTranslator();
  const { user } = await getCachedUser();

  if (!user) {
    redirect("/login");
  }

  const events = await getUpcomingEvents();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-4xl">
          <div className="mb-8">
            <h1 className="heading-page">
              {t("events.title")}
            </h1>
            <p className="subtitle mt-2">
              {t("events.subtitle")}
            </p>
          </div>

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
