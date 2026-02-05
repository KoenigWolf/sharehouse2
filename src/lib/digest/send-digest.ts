"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/errors";
import { sendPushNotification } from "@/lib/push/actions";
import { t } from "@/lib/i18n";

export async function sendMorningDigest() {
  const supabase = await createClient();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayOfWeek = today.getDay();

  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const threeDaysLaterStr = threeDaysLater.toISOString().split("T")[0];

  const twentyFourHoursAgo = new Date(today);
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const [garbageResult, bulletinResult, eventResult, shareResult, usersResult] =
    await Promise.all([
      supabase
        .from("garbage_schedule")
        .select("garbage_type")
        .eq("day_of_week", dayOfWeek),
      supabase
        .from("bulletins")
        .select("id")
        .gte("updated_at", twentyFourHoursAgo.toISOString()),
      supabase
        .from("events")
        .select("id")
        .gte("event_date", todayStr)
        .lte("event_date", threeDaysLaterStr),
      supabase
        .from("share_items")
        .select("id")
        .eq("status", "available")
        .gte("expires_at", today.toISOString()),
      supabase.from("profiles").select("id"),
    ]);

  const garbageTypes = (garbageResult.data ?? [])
    .map((g) => g.garbage_type)
    .filter(Boolean);
  const bulletinCount = bulletinResult.data?.length ?? 0;
  const eventCount = eventResult.data?.length ?? 0;
  const shareCount = shareResult.data?.length ?? 0;
  const users = usersResult.data ?? [];

  const bodyParts: string[] = [];

  if (garbageTypes.length > 0) {
    bodyParts.push(t("digest.garbageToday", { type: garbageTypes.join(", ") }));
  }
  if (bulletinCount > 0) {
    bodyParts.push(t("digest.newBulletins", { count: bulletinCount }));
  }
  if (eventCount > 0) {
    bodyParts.push(t("digest.upcomingEvents", { count: eventCount }));
  }
  if (shareCount > 0) {
    bodyParts.push(t("digest.shareItems", { count: shareCount }));
  }

  if (bodyParts.length === 0) return;

  const body = bodyParts.join("\n");

  for (const user of users) {
    try {
      await sendPushNotification(user.id, {
        title: t("digest.title"),
        body,
      });
    } catch (err) {
      logError(err, { action: "sendMorningDigest", userId: user.id });
    }
  }
}
