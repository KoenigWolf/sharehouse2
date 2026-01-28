"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/errors";
import { sendPushNotification } from "@/lib/push/actions";

export async function sendDutyReminders() {
  const supabase = await createClient();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dutyDate = tomorrow.toISOString().split("T")[0];

  const { data: duties, error } = await supabase
    .from("garbage_duties")
    .select("*")
    .eq("duty_date", dutyDate);

  if (error) {
    logError(error);
    throw error;
  }

  if (!duties || duties.length === 0) {
    return;
  }

  for (const duty of duties) {
    try {
      await sendPushNotification(duty.user_id, {
        title: "garbage.dutyReminder",
        body: `${duty.garbage_type} - ${dutyDate}`,
      });
    } catch (err) {
      logError(err);
    }
  }
}
