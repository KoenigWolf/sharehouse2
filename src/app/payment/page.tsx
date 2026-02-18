"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { m } from "framer-motion";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { useI18n } from "@/hooks/use-i18n";
import { PageTransition } from "@/components/page-transition";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type PaymentState = "idle" | "processing" | "error";

export default function PaymentPage() {
  const t = useI18n();
  const searchParams = useSearchParams();
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const type = searchParams.get("type") ?? "event_fee";
  const amount = parseInt(searchParams.get("amount") ?? "1000", 10);
  const description = searchParams.get("description") ?? "";
  const eventId = searchParams.get("event_id") ?? "";

  const handlePayment = async () => {
    setPaymentState("processing");
    setErrorMessage("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount,
          description,
          metadata: eventId ? { event_id: eventId } : {},
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Payment failed");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setPaymentState("error");
      setErrorMessage(
        err instanceof Error ? err.message : t("payment.errors.failed")
      );
    }
  };

  const getTitle = () => {
    switch (type) {
      case "event_fee":
        return t("payment.eventFee");
      case "deposit":
        return t("payment.deposit");
      default:
        return t("payment.title");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <PageTransition>
        <main className="pt-24 pb-32">
          <div className="container mx-auto px-6 max-w-md">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Link
                href="/concept"
                className="inline-flex items-center text-sm text-foreground/50 hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                {t("common.back")}
              </Link>

              <h1 className="text-3xl font-bold text-foreground/90 mb-2">
                {getTitle()}
              </h1>
              {description && (
                <p className="text-foreground/60">{description}</p>
              )}
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-foreground/[0.02] border border-foreground/10 rounded-xl p-8"
            >
              <div className="text-center mb-8">
                <p className="text-sm text-foreground/50 mb-2">
                  {t("payment.amount")}
                </p>
                <p className="text-4xl font-bold text-foreground">
                  ¥{amount.toLocaleString()}
                </p>
              </div>

              {paymentState === "error" && errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {errorMessage}
                </div>
              )}

              <Button
                onClick={handlePayment}
                disabled={paymentState === "processing"}
                className="w-full h-12 bg-brand-500 hover:bg-brand-600 text-white"
              >
                {paymentState === "processing" ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    {t("payment.paying")}
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 w-4 h-4" />
                    {t("payment.pay")}
                  </>
                )}
              </Button>

              <p className="text-xs text-foreground/40 text-center mt-4">
                Powered by Stripe
              </p>
            </m.div>
          </div>
        </main>
      </PageTransition>
      <Footer variant="minimal" />
      <MobileNav />
    </div>
  );
}
