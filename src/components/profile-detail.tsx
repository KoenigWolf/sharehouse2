import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Profile } from "@/types/profile";

interface ProfileDetailProps {
  profile: Profile;
  isOwnProfile: boolean;
  teaTimeEnabled?: boolean;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const calculateResidenceMonths = (dateString: string | null) => {
  if (!dateString) return null;
  const moveIn = new Date(dateString);
  const now = new Date();
  const months = (now.getFullYear() - moveIn.getFullYear()) * 12 + (now.getMonth() - moveIn.getMonth());
  if (months < 1) return "入居したばかり";
  if (months < 12) return `${months}ヶ月`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years}年`;
  return `${years}年${remainingMonths}ヶ月`;
};

export function ProfileDetail({ profile, isOwnProfile, teaTimeEnabled }: ProfileDetailProps) {
  const isMockProfile = profile.id.startsWith("mock-");

  return (
    <div>
      {/* 戻るリンク */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[#737373] hover:text-[#1a1a1a] mb-3 transition-colors"
      >
        <span>←</span>
        <span>戻る</span>
      </Link>

      {/* 未登録バナー */}
      {isMockProfile && (
        <div className="mb-3 p-4 border border-dashed border-[#d4d4d4] bg-[#fafaf8]">
          <p className="text-sm text-[#737373]">
            この部屋はまだ住民が登録されていません
          </p>
          <p className="text-xs text-[#a3a3a3] mt-1">
            サンプルデータを表示しています
          </p>
        </div>
      )}

      <div className={`bg-white border ${isMockProfile ? "border-dashed border-[#d4d4d4]" : "border-[#e5e5e5]"}`}>
        {/* 横並びレイアウト */}
        <div className="flex flex-col sm:flex-row">
          {/* アバター */}
          <div className="sm:w-1/3 aspect-square sm:aspect-auto bg-[#f5f5f3] flex items-center justify-center overflow-hidden">
            <Avatar className="w-full h-full rounded-none">
              <AvatarImage
                src={profile.avatar_url || undefined}
                className="object-cover w-full h-full"
              />
              <AvatarFallback className="bg-[#f5f5f3] text-[#a3a3a3] text-5xl rounded-none w-full h-full">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* 情報 */}
          <div className="flex-1 p-5">
            {/* 名前と編集ボタン */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl text-[#1a1a1a] tracking-wide">
                  {profile.name}
                </h1>
                {profile.room_number && (
                  <p className="text-sm text-[#737373]">{profile.room_number}号室</p>
                )}
              </div>
              {isOwnProfile && (
                <Link href={`/profile/${profile.id}/edit`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none border-[#e5e5e5] text-[#737373] hover:border-[#b94a48] hover:text-[#b94a48] h-7 text-xs"
                  >
                    編集
                  </Button>
                </Link>
              )}
            </div>

            {/* 入居情報 */}
            {profile.move_in_date && (
              <div className="flex items-center gap-4 py-3 border-y border-[#e5e5e5] mb-4 text-sm">
                <div>
                  <p className="text-[10px] text-[#a3a3a3]">入居日</p>
                  <p className="text-[#1a1a1a]">{formatDate(profile.move_in_date)}</p>
                </div>
                <div className="w-px h-6 bg-[#e5e5e5]" />
                <div>
                  <p className="text-[10px] text-[#a3a3a3]">居住期間</p>
                  <p className="text-[#1a1a1a]">{calculateResidenceMonths(profile.move_in_date)}</p>
                </div>
              </div>
            )}

            {/* 自己紹介 */}
            {profile.bio && (
              <div className="mb-4">
                <p className="text-sm text-[#1a1a1a] leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* 趣味・関心 */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-[#f5f5f3] text-[#737373]"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {/* ティータイム参加状況 */}
            <div className="flex items-center gap-2 pt-3 border-t border-[#e5e5e5]">
              <span className="text-base">☕</span>
              <span className={`text-xs ${teaTimeEnabled ? "text-[#16a34a]" : "text-[#a3a3a3]"}`}>
                ティータイム {teaTimeEnabled ? "参加中" : "不参加"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
