"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
    <Button
      type="button"
      variant="outline"
      size="xl"
      onClick={handleLogout}
      className="w-full text-[#a3a3a3] hover:text-[#737373] hover:border-[#d4d4d4]"
    >
      {t("nav.logout")}
    </Button>
  );
}
