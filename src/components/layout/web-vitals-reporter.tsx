"use client";

import { useEffect } from "react";
import { initWebVitals } from "@/lib/utils/web-vitals";

export function WebVitalsReporter() {
  useEffect(() => {
    initWebVitals({
      endpoint: process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT,
    });
  }, []);

  return null;
}
