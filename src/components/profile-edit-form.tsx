"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Profile } from "@/types/profile";

interface ProfileEditFormProps {
  profile: Profile;
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [formData, setFormData] = useState({
    name: profile.name,
    room_number: profile.room_number || "",
    bio: profile.bio || "",
    interests: profile.interests?.join(", ") || "",
    move_in_date: profile.move_in_date || "",
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${profile.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setIsLoading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    setAvatarUrl(publicUrl);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const interests = formData.interests
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: formData.name,
        room_number: formData.room_number || null,
        bio: formData.bio || null,
        avatar_url: avatarUrl,
        interests,
        move_in_date: formData.move_in_date || null,
      })
      .eq("id", profile.id);

    if (error) {
      console.error("Update error:", error);
      setIsLoading(false);
      return;
    }

    router.push(`/profile/${profile.id}`);
    router.refresh();
  };

  return (
    <div>
      {/* 戻るリンク */}
      <Link
        href={`/profile/${profile.id}`}
        className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-[#1a1a1a] mb-8 transition-colors"
      >
        <span>←</span>
        <span>プロフィールに戻る</span>
      </Link>

      <div className="bg-white border border-[#e5e5e5]">
        <div className="p-8 border-b border-[#e5e5e5]">
          <h1 className="text-xl text-[#1a1a1a] tracking-wide">プロフィール編集</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* アバター */}
          <div className="flex flex-col items-center pb-8 border-b border-[#e5e5e5]">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="relative group"
            >
              <Avatar className="w-24 h-24 rounded-none">
                <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                <AvatarFallback className="bg-[#f5f5f3] text-[#737373] text-2xl rounded-none">
                  {getInitials(formData.name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs">変更</span>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-xs text-[#737373] mt-3">クリックして画像を変更</p>
          </div>

          {/* 名前 */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs text-[#737373] tracking-wide">
              名前 <span className="text-[#b94a48]">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="h-12 border-[#e5e5e5] rounded-none focus:border-[#1a1a1a] focus:ring-0"
            />
          </div>

          {/* 部屋番号 */}
          <div className="space-y-2">
            <Label htmlFor="room_number" className="text-xs text-[#737373] tracking-wide">
              部屋番号
            </Label>
            <Input
              id="room_number"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              placeholder="例: 201"
              className="h-12 border-[#e5e5e5] rounded-none focus:border-[#1a1a1a] focus:ring-0"
            />
          </div>

          {/* 自己紹介 */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-xs text-[#737373] tracking-wide">
              自己紹介
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="自己紹介を書いてみましょう..."
              rows={4}
              className="border-[#e5e5e5] rounded-none focus:border-[#1a1a1a] focus:ring-0 resize-none"
            />
          </div>

          {/* 趣味・関心 */}
          <div className="space-y-2">
            <Label htmlFor="interests" className="text-xs text-[#737373] tracking-wide">
              趣味・関心
            </Label>
            <Input
              id="interests"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              placeholder="例: 料理, 映画鑑賞, ランニング"
              className="h-12 border-[#e5e5e5] rounded-none focus:border-[#1a1a1a] focus:ring-0"
            />
            <p className="text-xs text-[#a3a3a3]">カンマ区切りで入力</p>
          </div>

          {/* 入居日 */}
          <div className="space-y-2">
            <Label htmlFor="move_in_date" className="text-xs text-[#737373] tracking-wide">
              入居日
            </Label>
            <Input
              id="move_in_date"
              type="date"
              value={formData.move_in_date}
              onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
              className="h-12 border-[#e5e5e5] rounded-none focus:border-[#1a1a1a] focus:ring-0"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 h-12 rounded-none border-[#e5e5e5] text-[#1a1a1a] hover:border-[#1a1a1a]"
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 rounded-none bg-[#b94a48] hover:bg-[#a13f3d] text-white"
              disabled={isLoading}
            >
              {isLoading ? "保存中..." : "保存する"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
