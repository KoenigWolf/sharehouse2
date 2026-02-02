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
      <body>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#fafafa",
            display: "flex",
            flexDirection: "column",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <header
            style={{
              borderBottom: "1px solid #e4e4e7",
              backgroundColor: "white",
            }}
          >
            <div
              style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "0 24px",
                height: "64px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  letterSpacing: "0.05em",
                  color: "#18181b",
                }}
              >
                SHARE HOUSE
              </span>
            </div>
          </header>

          <main
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
            }}
          >
            <div style={{ textAlign: "center", maxWidth: "400px" }}>
              <p
                style={{
                  fontSize: "60px",
                  color: "#d4d4d8",
                  marginBottom: "24px",
                  fontWeight: 300,
                }}
              >
                Error
              </p>
              <h1
                style={{
                  fontSize: "20px",
                  color: "#18181b",
                  marginBottom: "12px",
                  letterSpacing: "0.05em",
                  fontWeight: 400,
                }}
              >
                {t("pages.globalError.title")}
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "#71717a",
                  marginBottom: "32px",
                lineHeight: 1.6,
              }}
            >
                {t("pages.globalError.description")}
              </p>
              <button
                onClick={reset}
                style={{
                  padding: "12px 32px",
                  backgroundColor: "#18181b",
                  color: "white",
                  fontSize: "14px",
                  letterSpacing: "0.05em",
                border: "none",
                cursor: "pointer",
              }}
            >
                {t("pages.globalError.reload")}
              </button>
            </div>
          </main>

          <footer
            style={{
              borderTop: "1px solid #e4e4e7",
              backgroundColor: "white",
            }}
          >
            <div
              style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "16px 24px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#a1a1aa",
                  textAlign: "center",
                }}
              >
                Share House Portal
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
