"use client";

import { ReactNode } from "react";
import { TeaserOverlay } from "@/components/public-teaser/teaser-overlay";

interface BlurredPageContentProps {
  children: ReactNode;
  isBlurred: boolean;
  /** オーバーレイに表示する人数（任意） */
  totalCount?: number;
}

/**
 * 未認証ユーザー向けにコンテンツをモザイク表示するラッパー
 * - blur-sm で軽くぼかす
 * - グラデーションで下部をフェード
 * - ログイン促進オーバーレイを表示
 */
export function BlurredPageContent({
  children,
  isBlurred,
  totalCount,
}: BlurredPageContentProps) {
  if (!isBlurred) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-8">
      <div className="relative max-h-[700px] overflow-hidden">
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none" />
      </div>

      <div className="-mt-32 relative z-10">
        <TeaserOverlay totalCount={totalCount} />
      </div>
    </div>
  );
}
