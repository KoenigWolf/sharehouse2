"use client";

import { m } from "framer-motion";
import { XCircle } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { useI18n } from "@/hooks/use-i18n";
import { PageTransition } from "@/components/page-transition";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
  const t = useI18n();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <PageTransition>
        <main className="pt-24 pb-32">
          <div className="container mx-auto px-6 max-w-lg">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-amber-100 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold text-foreground/90 mb-4">
                {t("payment.errors.canceled")}
              </h1>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="outline">
                  <Link href="/payment">{t("common.back")}</Link>
                </Button>
                <Button asChild>
                  <Link href="/concept">{t("contact.success.backToTop")}</Link>
                </Button>
              </div>
            </m.div>
          </div>
        </main>
      </PageTransition>
      <Footer variant="minimal" />
      <MobileNav />
    </div>
  );
}
