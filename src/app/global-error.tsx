"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログに記録
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="ja">
      <body>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#fafaf8",
            display: "flex",
            flexDirection: "column",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* ヘッダー */}
          <header
            style={{
              borderBottom: "1px solid #e5e5e5",
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
                  color: "#1a1a1a",
                }}
              >
                SHARE HOUSE
              </span>
            </div>
          </header>

          {/* メインコンテンツ */}
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
                  color: "#d4d4d4",
                  marginBottom: "24px",
                  fontWeight: 300,
                }}
              >
                Error
              </p>
              <h1
                style={{
                  fontSize: "20px",
                  color: "#1a1a1a",
                  marginBottom: "12px",
                  letterSpacing: "0.05em",
                  fontWeight: 400,
                }}
              >
                問題が発生しました
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "#737373",
                  marginBottom: "32px",
                  lineHeight: 1.6,
                }}
              >
                予期しないエラーが発生しました。ページを再読み込みしてください。
              </p>
              <button
                onClick={reset}
                style={{
                  padding: "12px 32px",
                  backgroundColor: "#1a1a1a",
                  color: "white",
                  fontSize: "14px",
                  letterSpacing: "0.05em",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                再読み込み
              </button>
            </div>
          </main>

          {/* フッター */}
          <footer
            style={{
              borderTop: "1px solid #e5e5e5",
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
                  color: "#a3a3a3",
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
