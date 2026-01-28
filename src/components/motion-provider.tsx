"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

/**
 * アニメーションプロバイダー
 *
 * LazyMotion + domAnimation で framer-motion のバンドルサイズを最小化する。
 * domAnimation は DOM アニメーション機能のみを含み（約5KB gzip）、
 * 3Dトランスフォームやレイアウトアニメーション等の高度機能は除外される。
 *
 * strict を付けないのは、layoutId を使用するコンポーネント（header, mobile-nav,
 * residents-grid）が motion コンポーネントを必要とするため。
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
