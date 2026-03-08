"use client";

import { useEffect } from "react";
import { initWebVitals } from "@/lib/utils/web-vitals";

export function WebVitalsReporter() {
  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT;
    if (!endpoint) return;

    initWebVitals({ endpoint });
  }, []);

  return null;
}
