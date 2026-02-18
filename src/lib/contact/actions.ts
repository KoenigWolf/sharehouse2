"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/errors";
import { checkRateLimitAsync } from "@/lib/security";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export type ContactErrorCode = "SUBMIT_FAILED" | "RATE_LIMITED";

export async function submitContactForm(
  data: ContactFormData
): Promise<{ success: true } | { error: ContactErrorCode }> {
  try {
    const rateLimit = await checkRateLimitAsync(`contact:${data.email}`, {
      limit: 3,
      windowMs: 60 * 1000,
      prefix: "contact",
    });

    if (!rateLimit.success) {
      return { error: "RATE_LIMITED" };
    }

    const supabase = await createClient();

    const { error } = await supabase.from("contact_submissions").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
      created_at: new Date().toISOString(),
    });

    if (error) {
      logError(error, { action: "submitContactForm" });
      return { error: "SUBMIT_FAILED" };
    }

    return { success: true };
  } catch (err) {
    logError(err, { action: "submitContactForm" });
    return { error: "SUBMIT_FAILED" };
  }
}
