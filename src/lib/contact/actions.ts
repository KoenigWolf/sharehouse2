"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/errors";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export async function submitContactForm(
  data: ContactFormData
): Promise<{ success: true } | { error: string }> {
  try {
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
      return { error: "送信に失敗しました。しばらく経ってから再度お試しください。" };
    }

    // TODO: Send email notification to admin using Resend or similar service
    // await sendAdminNotification(data);

    return { success: true };
  } catch (err) {
    logError(err, { action: "submitContactForm" });
    return { error: "送信に失敗しました。しばらく経ってから再度お試しください。" };
  }
}
