import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/cached-queries";

export default async function SettingsEditPage() {
  const { user } = await getCachedUser();

  if (!user) {
    redirect("/login");
  }

  redirect(`/profile/${user.id}/edit`);
}
