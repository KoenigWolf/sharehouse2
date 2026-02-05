"use client";

import { useEffect } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { normalizeLocale } from "@/lib/i18n";
import { logError } from "@/lib/errors";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useI18n();
  const locale = normalizeLocale(
    typeof document !== "undefined"
      ? document.documentElement.lang || navigator.language
      : undefined
  );

  useEffect(() => {
    logError(error, {
      action: "global-error-boundary",
      metadata: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang={locale}>
      <head>
        <title>Error - Share House Portal</title>
      </head>
      <body>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#f8fafc", // slate-50
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Geist Sans", "Segoe UI", Roboto, sans-serif',
            position: "relative",
            overflow: "hidden",
            margin: 0,
          }}
        >
          {/* Fallback for background blobs */}
          <div
            style={{
              position: "absolute",
              top: "-10%",
              right: "-10%",
              width: "40%",
              height: "40%",
              backgroundColor: "rgba(254, 242, 242, 0.5)", // error-bg
              borderRadius: "50%",
              filter: "blur(120px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-10%",
              left: "-10%",
              width: "40%",
              height: "40%",
              backgroundColor: "rgba(236, 253, 245, 0.3)", // brand-50
              borderRadius: "50%",
              filter: "blur(120px)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              zIndex: 10,
              textAlign: "center",
              maxWidth: "480px",
              width: "100%"
            }}
          >
            <div
              style={{
                fontSize: "min(20vw, 120px)",
                fontWeight: 800,
                color: "#f1f5f9", // slate-100
                marginBottom: "-40px",
                userSelect: "none",
                letterSpacing: "-0.05em",
                textTransform: "uppercase",
              }}
            >
              Error
            </div>

            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                padding: "48px",
                borderRadius: "40px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.5)",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  backgroundColor: "#fee2e2", // error-bg
                  color: "#8b4040", // error
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px auto",
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>

              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#0f172a", // slate-900
                  marginBottom: "16px",
                  letterSpacing: "-0.02em",
                }}
              >
                {t("pages.globalError.title")}
              </h1>

              <p
                style={{
                  fontSize: "15px",
                  color: "#64748b", // slate-500
                  marginBottom: "32px",
                  lineHeight: 1.6,
                }}
              >
                {t("pages.globalError.description")}
              </p>

              <button
                onClick={reset}
                style={{
                  width: "100%",
                  padding: "16px 32px",
                  backgroundColor: "#0f172a", // slate-900
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: "16px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.3)",
                  transition: "all 0.2s",
                }}
              >
                {t("pages.globalError.reload")}
              </button>
            </div>

            <div style={{ marginTop: "40px", color: "#94a3b8", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Share House Portal
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
