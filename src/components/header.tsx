"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { href: "/", label: "住民" },
    { href: "/tea-time", label: "Tea Time" },
  ];

  const isSettingsActive = pathname === "/settings";

  return (
    <header className="border-b border-[#e5e5e5] bg-white">
      <div className="container mx-auto px-3 sm:px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="text-xs sm:text-sm font-medium tracking-wider text-[#1a1a1a]">
            SHARE HOUSE
          </Link>
          <nav className="flex gap-2 sm:gap-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[11px] sm:text-xs tracking-wide transition-colors ${
                    isActive
                      ? "text-[#b94a48]"
                      : "text-[#737373] hover:text-[#1a1a1a]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/settings"
            className={`text-[11px] sm:text-xs tracking-wide transition-colors ${
              isSettingsActive
                ? "text-[#b94a48]"
                : "text-[#737373] hover:text-[#1a1a1a]"
            }`}
          >
            マイページ
          </Link>
          <button
            onClick={handleLogout}
            className="text-[11px] sm:text-xs text-[#a3a3a3] hover:text-[#1a1a1a] transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
