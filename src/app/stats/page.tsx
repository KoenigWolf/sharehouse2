import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { ResidentStats } from "@/components/resident-stats";
import { getServerTranslator } from "@/lib/i18n/server";
import { getProfilesWithMock } from "@/lib/residents/queries";
import { getCachedUser } from "@/lib/supabase/cached-queries";

export default async function StatsPage() {
  const t = await getServerTranslator();
  const { user, supabase } = await getCachedUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const [
    { profiles },
    teaTimeResult,
    eventsResult,
    eventAttendeesResult,
    shareItemsResult,
    roomPhotosResult,
    teaTimeMatchesResult,
    garbageDutiesResult,
    bulletinsResult,
  ] = await Promise.all([
    getProfilesWithMock(supabase),
    supabase
      .from("tea_time_settings")
      .select("user_id")
      .eq("is_enabled", true),
    supabase
      .from("events")
      .select("id, user_id, event_date, created_at"),
    supabase
      .from("event_attendees")
      .select("event_id, user_id"),
    supabase
      .from("share_items")
      .select("id, user_id, status, expires_at, created_at"),
    supabase
      .from("room_photos")
      .select("id, user_id, created_at"),
    supabase
      .from("tea_time_matches")
      .select("id, user1_id, user2_id, status, matched_at"),
    supabase
      .from("garbage_duties")
      .select("id, user_id, duty_date, is_completed"),
    supabase
      .from("bulletins")
      .select("id, user_id, updated_at"),
  ]);

  const teaTimeParticipants = (teaTimeResult.data ?? []).map((row) => row.user_id);

  const events = eventsResult.data ?? [];
  const eventAttendees = eventAttendeesResult.data ?? [];
  const upcomingEvents = events.filter((e) => e.event_date >= todayStr);
  const pastEvents = events.filter((e) => e.event_date < todayStr);

  const shareItems = shareItemsResult.data ?? [];
  const availableItems = shareItems.filter((i) => i.status === "available" && (!i.expires_at || i.expires_at > now.toISOString()));
  const claimedItems = shareItems.filter((i) => i.status === "claimed");
  const expiredItems = shareItems.filter((i) => i.status === "available" && i.expires_at && i.expires_at <= now.toISOString());

  const roomPhotos = roomPhotosResult.data ?? [];

  const teaTimeMatches = teaTimeMatchesResult.data ?? [];
  const doneMatches = teaTimeMatches.filter((m) => m.status === "done");
  const skippedMatches = teaTimeMatches.filter((m) => m.status === "skipped");

  const garbageDuties = garbageDutiesResult.data ?? [];
  const completedDuties = garbageDuties.filter((d) => d.is_completed);
  const upcomingDuties = garbageDuties.filter((d) => d.duty_date >= todayStr && !d.is_completed);

  const bulletins = bulletinsResult.data ?? [];

  const extendedStats = {
    events: {
      total: events.length,
      upcoming: upcomingEvents.length,
      past: pastEvents.length,
      totalAttendees: eventAttendees.length,
      uniqueCreators: new Set(events.map((e) => e.user_id)).size,
      avgAttendeesPerEvent: events.length > 0 ? Math.round((eventAttendees.length / events.length) * 10) / 10 : 0,
    },
    shareItems: {
      total: shareItems.length,
      available: availableItems.length,
      claimed: claimedItems.length,
      expired: expiredItems.length,
      uniqueSharers: new Set(shareItems.map((i) => i.user_id)).size,
    },
    roomPhotos: {
      total: roomPhotos.length,
      uniqueUploaders: new Set(roomPhotos.map((p) => p.user_id)).size,
      photosPerUser: roomPhotos.length > 0 && new Set(roomPhotos.map((p) => p.user_id)).size > 0
        ? Math.round((roomPhotos.length / new Set(roomPhotos.map((p) => p.user_id)).size) * 10) / 10
        : 0,
    },
    teaTimeMatches: {
      total: teaTimeMatches.length,
      done: doneMatches.length,
      skipped: skippedMatches.length,
      successRate: teaTimeMatches.length > 0 ? Math.round((doneMatches.length / teaTimeMatches.length) * 100) : 0,
    },
    garbageDuties: {
      total: garbageDuties.length,
      completed: completedDuties.length,
      upcoming: upcomingDuties.length,
      completionRate: garbageDuties.length > 0 ? Math.round((completedDuties.length / garbageDuties.length) * 100) : 0,
    },
    bulletins: {
      total: bulletins.length,
      uniquePosters: new Set(bulletins.map((b) => b.user_id)).size,
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl font-light text-foreground tracking-wide">
              {t("residents.statsTitle")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">{t("residents.statsSubtitle")}</p>
          </div>

          <ResidentStats
            profiles={profiles}
            teaTimeParticipants={teaTimeParticipants}
            extendedStats={extendedStats}
          />
        </div>
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
