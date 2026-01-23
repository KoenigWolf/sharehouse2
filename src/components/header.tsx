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
    { href: "/", label: "住民一覧" },
    { href: "/tea-time", label: "ティータイム" },
  ];

  return (
    <header className="border-b border-[#e5e5e5] bg-white">
      <div className="container mx-auto px-6">
        {/* 上部：ロゴとログアウト */}
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="text-lg tracking-wider text-[#1a1a1a]">
            SHARE HOUSE
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-[#737373] hover:text-[#1a1a1a] transition-colors"
          >
            ログアウト
          </button>
        </div>

        {/* ナビゲーション */}
        <nav className="flex gap-8 -mb-px">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`py-3 text-sm tracking-wide border-b-2 transition-colors ${
                  isActive
                    ? "border-[#b94a48] text-[#1a1a1a]"
                    : "border-transparent text-[#737373] hover:text-[#1a1a1a]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
