"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/use-i18n";

export function LogoutButton() {
  const router = useRouter();
  const t = useI18n();

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full h-12 border border-[#e5e5e5] text-sm text-[#a3a3a3] hover:text-[#737373] hover:border-[#d4d4d4] tracking-wide transition-colors"
    >
      {t("nav.logout")}
    </button>
  );
}
