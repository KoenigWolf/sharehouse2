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
 *
 * 心理学的アプローチ:
 * - 好奇心ギャップ: 少しだけ見えると「もっと知りたい」欲求が生まれる
 * - ザイガルニック効果: 未完了のものは記憶に残りやすい
 * - blur-[2px]: 文字がギリギリ読めそうで読めない絶妙なぼかし
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
      <div className="relative max-h-[900px] overflow-hidden">
        <div className="blur-[2px] pointer-events-none select-none" aria-hidden="true">
          {children}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
      </div>

      <div className="-mt-24 relative z-10">
        <TeaserOverlay totalCount={totalCount} />
      </div>
    </div>
  );
}
