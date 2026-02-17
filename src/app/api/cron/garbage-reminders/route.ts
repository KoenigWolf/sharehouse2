import { NextResponse } from "next/server";
import { sendDutyReminders } from "@/lib/garbage/reminders";
import { validateCronSecret } from "@/lib/security";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!validateCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sendDutyReminders();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
