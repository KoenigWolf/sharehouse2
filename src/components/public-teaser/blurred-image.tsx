"use client";

import { m } from "framer-motion";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlurredImageProps {
  /** User ID to generate a deterministic gradient placeholder */
  userId: string;
  className?: string;
}

/**
 * セキュリティ上、未認証ユーザーには実画像を配信しない。
 * ユーザー ID からハッシュ的にグラデーションカラーを生成し、
 * ぼかしプレースホルダーとして表示する。
 */
export function BlurredImage({ userId, className }: BlurredImageProps) {
  const hue = hashToHue(userId);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="w-full h-full blur-xl scale-110"
        style={{
          background: `linear-gradient(135deg, hsl(${hue}, 40%, 85%) 0%, hsl(${(hue + 40) % 360}, 35%, 75%) 100%)`,
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5">
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-brand-500"
        >
          <Lock className="w-4 h-4" />
        </m.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
    </div>
  );
}

/** 文字列から 0-359 のハッシュ値を生成 */
function hashToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}
