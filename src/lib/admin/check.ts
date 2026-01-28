"use server";

import { createClient } from "@/lib/supabase/server";
import type { Translator } from "@/lib/i18n";

/**
 * 現在ログイン中のユーザーが管理者かどうかを確認する
 *
 * @returns 管理者の場合 true
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    return data?.is_admin === true;
  } catch {
    return false;
  }
}

/**
 * 管理者権限を要求する（サーバーアクション用ガード）
 *
 * @param t - 翻訳関数
 * @returns 管理者でない場合はエラーメッセージ、管理者の場合は null
 */
export async function requireAdmin(t: Translator): Promise<string | null> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return t("errors.forbidden");
  return null;
}
