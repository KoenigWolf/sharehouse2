import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { HomeContent } from "@/components/home-content";
import { getLatestScheduledMatch } from "@/lib/tea-time/actions";
import { getBulletins } from "@/lib/bulletin/actions";
import { getShareItems } from "@/lib/share/actions";
import { getUpcomingEvents } from "@/lib/events/actions";
import { Profile } from "@/domain/profile";
import { mockProfiles } from "@/lib/mock-data";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profilesResult, latestMatch, bulletins, shareItems, events] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, nickname, room_number, avatar_url, move_in_date, mbti, interests, occupation, industry, work_style, daily_rhythm, social_stance, sns_x, sns_instagram, sns_github, is_admin")
      .order("name"),
    getLatestScheduledMatch(),
    getBulletins(),
    getShareItems(),
    getUpcomingEvents(),
  ]);

  const dbProfiles = (profilesResult.data as Profile[]) || [];

  const registeredRoomNumbers = new Set(
    dbProfiles.filter((p) => p.room_number).map((p) => p.room_number)
  );

  const remainingMockProfiles = mockProfiles.filter(
    (mock) => !registeredRoomNumbers.has(mock.room_number)
  );

  const profiles = [...dbProfiles, ...remainingMockProfiles];
  const mockCount = remainingMockProfiles.length;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-0">
        <HomeContent
          profiles={profiles}
          currentUserId={user.id}
          mockCount={mockCount}
          dbProfilesCount={dbProfiles.length}
          bulletins={bulletins}
          shareItems={shareItems}
          events={events}
          latestMatch={latestMatch}
        />
      </main>

      <Footer />

      <MobileNav />
    </div>
  );
}
