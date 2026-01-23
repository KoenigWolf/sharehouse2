"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UpdateProfileData {
  name: string;
  room_number: string | null;
  bio: string | null;
  interests: string[];
  move_in_date: string | null;
}

export async function updateProfile(data: UpdateProfileData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "認証が必要です" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name: data.name,
      room_number: data.room_number || null,
      bio: data.bio || null,
      interests: data.interests,
      move_in_date: data.move_in_date || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "プロフィールの更新に失敗しました" };
  }

  revalidatePath("/");
  revalidatePath(`/profile/${user.id}`);
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "認証が必要です" };
  }

  const file = formData.get("avatar") as File;
  if (!file || file.size === 0) {
    return { error: "ファイルが選択されていません" };
  }

  // ファイルサイズチェック (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "ファイルサイズは5MB以下にしてください" };
  }

  // ファイル形式チェック
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "JPG, PNG, WebP形式のみ対応しています" };
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;

  // 既存のアバターを削除
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.avatar_url && profile.avatar_url.includes("/avatars/")) {
    const oldFileName = profile.avatar_url.split("/avatars/").pop();
    if (oldFileName) {
      await supabase.storage.from("avatars").remove([oldFileName]);
    }
  }

  // ファイルをArrayBufferに変換
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // 新しいアバターをアップロード
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, uint8Array, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { error: `アップロードに失敗しました: ${uploadError.message}` };
  }

  // 公開URLを取得
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  // プロフィールを更新
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: urlData.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return { error: "プロフィールの更新に失敗しました" };
  }

  revalidatePath("/");
  revalidatePath(`/profile/${user.id}`);
  return { success: true, url: urlData.publicUrl };
}

export async function getMyProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function createProfile(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "認証が必要です" };
  }

  // 既存のプロフィールがあるか確認
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existing) {
    return { success: true };
  }

  // 新規プロフィール作成
  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    name: name.trim(),
    room_number: null,
    bio: null,
    avatar_url: null,
    interests: [],
    move_in_date: null,
  });

  if (error) {
    return { error: "プロフィールの作成に失敗しました" };
  }

  revalidatePath("/");
  return { success: true };
}
