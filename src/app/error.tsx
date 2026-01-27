"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/hooks/use-i18n";
import { logError } from "@/lib/errors";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useI18n();

  useEffect(() => {
    logError(error, {
      action: "error-boundary",
      metadata: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      {/* ヘッダー */}
      <header className="border-b border-[#e5e5e5] bg-white">
        <div className="container mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="text-lg tracking-wider text-[#1a1a1a]">
            SHARE HOUSE
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-6xl text-[#d4d4d4] mb-6 font-light">Error</p>
          <h1 className="text-xl text-[#1a1a1a] mb-3 tracking-wide">
            {t("pages.error.title")}
          </h1>
          <p className="text-sm text-[#737373] mb-8 leading-relaxed">
            {t("pages.error.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-8 py-3 bg-[#1a1a1a] text-white text-sm tracking-wide hover:bg-[#333] transition-colors"
            >
              {t("pages.error.retry")}
            </button>
            <Link
              href="/"
              className="px-8 py-3 border border-[#e5e5e5] text-[#1a1a1a] text-sm tracking-wide hover:bg-[#f5f5f3] transition-colors"
            >
              {t("pages.error.backHome")}
            </Link>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t border-[#e5e5e5] bg-white">
        <div className="container mx-auto px-6 py-4">
          <p className="text-xs text-[#a3a3a3] text-center">
            Share House Portal
          </p>
        </div>
      </footer>
    </div>
  );
}
