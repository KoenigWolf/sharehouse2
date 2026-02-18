"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/errors";

interface TourRequestData {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  notes: string;
}

export async function submitTourRequest(
  data: TourRequestData
): Promise<{ success: true } | { error: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("tour_requests").insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      preferred_date: data.date,
      preferred_time: data.time,
      notes: data.notes || null,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    if (error) {
      logError(error, { action: "submitTourRequest" });
      return { error: "予約に失敗しました。しばらく経ってから再度お試しください。" };
    }

    // TODO: Send confirmation email to user
    // TODO: Send notification email to admin

    return { success: true };
  } catch (err) {
    logError(err, { action: "submitTourRequest" });
    return { error: "予約に失敗しました。しばらく経ってから再度お試しください。" };
  }
}
