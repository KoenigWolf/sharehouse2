"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-[#f5f6f4] flex flex-col">
      <header className="border-b border-[#dddfd9] bg-white">
        <div className="container mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="text-lg tracking-wider text-[#272a26]">
            SHARE HOUSE
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-6xl text-[#bdc0ba] mb-6 font-light">Error</p>
          <h1 className="text-xl text-[#272a26] mb-3 tracking-wide">
            {t("pages.error.title")}
          </h1>
          <p className="text-sm text-[#636861] mb-8 leading-relaxed">
            {t("pages.error.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" onClick={reset}>
              {t("pages.error.retry")}
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link href="/">
                {t("pages.error.backHome")}
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#dddfd9] bg-white">
        <div className="container mx-auto px-6 py-4">
          <p className="text-xs text-[#959892] text-center">
            Share House Portal
          </p>
        </div>
      </footer>
    </div>
  );
}
