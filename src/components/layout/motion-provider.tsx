"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { SharedElementProvider } from "./shared-element";
import { ScrollRestoration } from "./scroll-restoration";

/**
 * layoutId を使用するコンポーネントが motion を必要とするため strict は付けない
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <SharedElementProvider>
          <ScrollRestoration />
          {children}
        </SharedElementProvider>
      </MotionConfig>
    </LazyMotion>
  );
}
