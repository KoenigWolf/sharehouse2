"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function signUp(name: string, email: string, password: string) {
  const supabase = await createClient();

  // ユーザー作成
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name.trim(),
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "このメールアドレスは既に登録されています" };
    }
    return { error: "登録に失敗しました。入力内容を確認してください" };
  }

  if (!data.user) {
    return { error: "ユーザーの作成に失敗しました" };
  }

  // プロフィール作成
  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    name: name.trim(),
    room_number: null,
    bio: null,
    avatar_url: null,
    interests: [],
    move_in_date: null,
  });

  if (profileError) {
    console.error("Profile creation error:", profileError);
    // プロフィール作成失敗してもユーザーは作成されているので続行
  }

  // 自動ログイン
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { success: true, needsLogin: true };
  }

  revalidatePath("/");
  return { success: true };
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません" };
  }

  // プロフィールが存在するか確認し、なければ作成
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    const userName = data.user.user_metadata?.name || data.user.email?.split("@")[0] || "ユーザー";
    await supabase.from("profiles").insert({
      id: data.user.id,
      name: userName,
      room_number: null,
      bio: null,
      avatar_url: null,
      interests: [],
      move_in_date: null,
    });
  }

  revalidatePath("/");
  return { success: true };
}
