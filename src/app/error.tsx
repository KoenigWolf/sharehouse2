"use client";

import { useEffect } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
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
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-error-bg/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-200/20 rounded-full blur-[120px] pointer-events-none" />

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg text-center relative z-10"
      >
        <div className="relative mb-8">
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
            className="text-[10rem] sm:text-[14rem] font-bold text-muted-foreground/10 select-none leading-none tracking-tighter uppercase"
          >
            {t("pages.error.label")}
          </m.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="bg-card/80 backdrop-blur-xl p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border border-border/50 premium-surface"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-error-bg text-error mb-6">
                <AlertCircle size={32} strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 tracking-tight">
                {t("pages.error.title")}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-8 max-w-xs mx-auto">
                {t("pages.error.description")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button size="xl" onClick={reset} className="rounded-2xl shadow-lg shadow-border/50 group bg-foreground hover:bg-foreground/90">
                  <RefreshCcw size={18} className="mr-2 group-active:rotate-180 transition-transform duration-500" />
                  {t("pages.error.retry")}
                </Button>
                <Button variant="outline" size="xl" asChild className="rounded-2xl bg-card border-border hover:bg-background hover:border-primary/40">
                  <Link href="/">
                    <Home size={18} className="mr-2" />
                    {t("pages.error.backHome")}
                  </Link>
                </Button>
              </div>
            </m.div>
          </div>
        </div>

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-12"
        >
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-medium">
            <span className="w-8 h-px bg-secondary" />
            <span className="tracking-widest uppercase text-[10px]">{t("pages.brandName")}</span>
            <span className="w-8 h-px bg-secondary" />
          </div>
        </m.div>
      </m.div>
    </div>
  );
}
