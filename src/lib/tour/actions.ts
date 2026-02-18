"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/errors";
import { checkRateLimitAsync } from "@/lib/security";

interface TourRequestData {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  notes: string;
}

export type TourErrorCode = "SUBMIT_FAILED" | "RATE_LIMITED";

export async function submitTourRequest(
  data: TourRequestData
): Promise<{ success: true } | { error: TourErrorCode }> {
  try {
    const rateLimit = await checkRateLimitAsync(`tour:${data.email}`, {
      limit: 3,
      windowMs: 60 * 1000,
      prefix: "tour",
    });

    if (!rateLimit.success) {
      return { error: "RATE_LIMITED" };
    }

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
      return { error: "SUBMIT_FAILED" };
    }

    return { success: true };
  } catch (err) {
    logError(err, { action: "submitTourRequest" });
    return { error: "SUBMIT_FAILED" };
  }
}
