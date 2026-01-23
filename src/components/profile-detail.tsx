"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Profile } from "@/types/profile";

interface ProfileDetailProps {
  profile: Profile;
  isOwnProfile: boolean;
}

export function ProfileDetail({ profile, isOwnProfile }: ProfileDetailProps) {
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
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div>
      {/* 戻るリンク */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-[#1a1a1a] mb-8 transition-colors"
      >
        <span>←</span>
        <span>住民一覧に戻る</span>
      </Link>

      <div className="bg-white border border-[#e5e5e5]">
        {/* ヘッダー部分 */}
        <div className="p-8 border-b border-[#e5e5e5]">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <Avatar className="w-24 h-24 rounded-none">
              <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-[#f5f5f3] text-[#737373] text-2xl rounded-none">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-2xl text-[#1a1a1a] tracking-wide">
                {profile.name}
              </h1>
              {profile.room_number && (
                <p className="text-sm text-[#737373] mt-1">
                  {profile.room_number}号室
                </p>
              )}

              {isOwnProfile && (
                <Link href={`/profile/${profile.id}/edit`} className="mt-4 inline-block">
                  <Button
                    variant="outline"
                    className="rounded-none border-[#e5e5e5] text-[#1a1a1a] hover:border-[#b94a48] hover:text-[#b94a48]"
                  >
                    編集する
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="p-8 space-y-8">
          {profile.bio && (
            <div>
              <h2 className="text-xs text-[#737373] tracking-wide mb-3">
                自己紹介
              </h2>
              <p className="text-[#1a1a1a] whitespace-pre-wrap leading-relaxed">
                {profile.bio}
              </p>
            </div>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <div>
              <h2 className="text-xs text-[#737373] tracking-wide mb-3">
                趣味・関心
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="text-sm px-3 py-1 bg-[#f5f5f3] text-[#1a1a1a]"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.move_in_date && (
            <div>
              <h2 className="text-xs text-[#737373] tracking-wide mb-3">
                入居日
              </h2>
              <p className="text-[#1a1a1a]">{formatDate(profile.move_in_date)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
