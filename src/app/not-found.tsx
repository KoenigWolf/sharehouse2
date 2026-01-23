import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] p-4">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-8 bg-[#f5f5f3] flex items-center justify-center">
          <span className="text-5xl">🏠</span>
        </div>
        <h1 className="text-5xl text-[#1a1a1a] mb-4 tracking-wide">404</h1>
        <p className="text-[#737373] mb-8">
          お探しのページが見つかりませんでした
        </p>
        <Link href="/">
          <Button className="h-12 px-8 bg-[#b94a48] hover:bg-[#a13f3d] text-white rounded-none tracking-wide">
            ホームに戻る
          </Button>
        </Link>
      </div>
    </div>
  );
}
