"use client";

import { useEffect } from "react";
import { initWebVitals } from "@/lib/utils/web-vitals";

/**
 * Web Vitals メトリクス収集コンポーネント
 *
 * レイアウトに配置してCore Web Vitals (LCP, FID, CLS) と
 * 補助メトリクス (FCP, TTFB, INP) の自動収集を有効化する。
 * 開発環境ではコンソールに出力、本番環境ではendpointにレポートする。
 */
export function WebVitalsReporter() {
  useEffect(() => {
    initWebVitals({
      endpoint: process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT,
    });
  }, []);

  return null;
}
