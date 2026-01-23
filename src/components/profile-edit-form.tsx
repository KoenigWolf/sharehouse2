"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Profile } from "@/types/profile";
import { updateProfile, uploadAvatar } from "@/lib/profile/actions";

interface ProfileEditFormProps {
  profile: Profile;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [formData, setFormData] = useState({
    name: profile.name,
    room_number: profile.room_number || "",
    bio: profile.bio || "",
    interests: profile.interests?.join(", ") || "",
    move_in_date: profile.move_in_date || "",
  });

  // プロフィール完成度を計算
  const completionItems = [
    { label: "写真", completed: !!avatarUrl },
    { label: "名前", completed: !!formData.name.trim() },
    { label: "部屋番号", completed: !!formData.room_number.trim() },
    { label: "自己紹介", completed: !!formData.bio.trim() },
    { label: "趣味・関心", completed: !!formData.interests.trim() },
  ];
  const completedCount = completionItems.filter((i) => i.completed).length;
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");
    setSuccess(false);

    const formDataUpload = new FormData();
    formDataUpload.append("avatar", file);

    const result = await uploadAvatar(formDataUpload);

    if ("error" in result) {
      setError(result.error);
    } else if ("url" in result) {
      setAvatarUrl(result.url);
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("名前は必須です");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    const interests = formData.interests
      .split(/[,、]/)
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const result = await updateProfile({
      name: formData.name.trim(),
      room_number: formData.room_number.trim() || null,
      bio: formData.bio.trim() || null,
      interests,
      move_in_date: formData.move_in_date || null,
    });

    setIsLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const interestsArray = formData.interests
    .split(/[,、]/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0);

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg text-[#1a1a1a] tracking-wide">マイページ</h1>
        <Link
          href={`/profile/${profile.id}`}
          className="text-xs text-[#737373] hover:text-[#b94a48] transition-colors"
        >
          公開プロフィールを見る →
        </Link>
      </div>

      {/* メッセージ */}
      {error && (
        <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-sm text-[#b94a48]">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-[#f0fdf4] border border-[#bbf7d0] text-sm text-[#16a34a]">
          保存しました
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        {/* 左：プレビュー */}
        <div className="md:col-span-2 space-y-4">
          {/* プロフィールカードプレビュー */}
          <div className="bg-white border border-[#e5e5e5]">
            <div className="p-3 border-b border-[#e5e5e5]">
              <p className="text-[11px] text-[#a3a3a3] tracking-wide">プレビュー</p>
            </div>
            <div className="p-4">
              {/* アバター */}
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploading}
                className="relative w-full aspect-square bg-[#f5f5f3] group mb-3"
              >
                <Avatar className="w-full h-full rounded-none">
                  <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                  <AvatarFallback className="bg-[#f5f5f3] text-[#a3a3a3] text-4xl rounded-none">
                    {getInitials(formData.name || "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm">
                    {isUploading ? "アップロード中..." : "写真を変更"}
                  </span>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#b94a48] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />

              {/* 名前・部屋番号 */}
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <h3 className="text-[#1a1a1a] font-medium truncate">
                  {formData.name || "名前未設定"}
                </h3>
                {formData.room_number && (
                  <span className="text-xs text-[#a3a3a3] shrink-0">
                    {formData.room_number}号室
                  </span>
                )}
              </div>

              {/* 趣味タグ */}
              {interestsArray.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {interestsArray.slice(0, 3).map((interest, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 bg-[#f5f5f3] text-[#737373]"
                    >
                      {interest}
                    </span>
                  ))}
                  {interestsArray.length > 3 && (
                    <span className="text-[11px] text-[#a3a3a3]">
                      +{interestsArray.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 完成度 */}
          <div className="bg-white border border-[#e5e5e5] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[#737373]">プロフィール完成度</p>
              <p className="text-sm text-[#1a1a1a] font-medium">{completionPercentage}%</p>
            </div>
            <div className="h-1.5 bg-[#f5f5f3] mb-3">
              <div
                className="h-full bg-[#b94a48] transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {completionItems.map((item) => (
                <span
                  key={item.label}
                  className={`text-[11px] px-2 py-0.5 ${
                    item.completed
                      ? "bg-[#f0fdf4] text-[#16a34a]"
                      : "bg-[#f5f5f3] text-[#a3a3a3]"
                  }`}
                >
                  {item.completed ? "✓" : "○"} {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 右：編集フォーム */}
        <div className="md:col-span-3">
          <form onSubmit={handleSubmit} className="bg-white border border-[#e5e5e5]">
            <div className="p-3 border-b border-[#e5e5e5]">
              <p className="text-[11px] text-[#a3a3a3] tracking-wide">基本情報</p>
            </div>

            <div className="p-4 space-y-4">
              {/* 名前 */}
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs text-[#737373]">
                  名前 <span className="text-[#b94a48]">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="山田 太郎"
                  required
                  className="h-10 border-[#e5e5e5] rounded-none focus:border-[#1a1a1a] focus:ring-0"
                />
              </div>

              {/* 部屋番号・入居日 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="room_number" className="text-xs text-[#737373]">
                    部屋番号
                  </Label>
                  <Input
                    id="room_number"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    placeholder="301"
                    className="h-10 border-[#e5e5e5] rounded-none focus:border-[#1a1a1a] focus:ring-0"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="move_in_date" className="text-xs text-[#737373]">
                    入居日
                  </Label>
                  <Input
                    id="move_in_date"
                    type="date"
                    value={formData.move_in_date}
                    onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                    className="h-10 border-[#e5e5e5] rounded-none focus:border-[#1a1a1a] focus:ring-0"
                  />
                </div>
              </div>

              {/* 自己紹介 */}
              <div className="space-y-1">
                <Label htmlFor="bio" className="text-xs text-[#737373]">
                  自己紹介
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="趣味や仕事、シェアハウスでやりたいことなど..."
                  rows={3}
                  className="border-[#e5e5e5] rounded-none focus:border-[#1a1a1a] focus:ring-0 resize-none text-sm"
                />
              </div>

              {/* 趣味・関心 */}
              <div className="space-y-1">
                <Label htmlFor="interests" className="text-xs text-[#737373]">
                  趣味・関心
                </Label>
                <Input
                  id="interests"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  placeholder="料理, 映画, ランニング"
                  className="h-10 border-[#e5e5e5] rounded-none focus:border-[#1a1a1a] focus:ring-0"
                />
                <p className="text-[11px] text-[#a3a3a3]">
                  カンマで区切って入力（共通の趣味がある住民を見つけやすくなります）
                </p>
              </div>

              {/* 保存ボタン */}
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-10 rounded-none bg-[#b94a48] hover:bg-[#a13f3d] text-white"
                  disabled={isLoading || isUploading}
                >
                  {isLoading ? "保存中..." : "変更を保存"}
                </Button>
              </div>
            </div>
          </form>

          {/* 写真アップロードのヒント */}
          <p className="text-[11px] text-[#a3a3a3] mt-3 text-center">
            <span className="hidden md:inline">写真は左のプレビューをクリックして変更できます</span>
            <span className="md:hidden">写真は上のプレビューをクリックして変更できます</span>
            （JPG/PNG/WebP, 5MB以下）
          </p>
        </div>
      </div>
    </div>
  );
}
