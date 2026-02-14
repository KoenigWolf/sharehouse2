"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/errors";
import type { SharedInfo } from "@/domain/shared-info";

/**
 * 共用情報を全件取得する
 *
 * display_order昇順でソートして返す。
 * 認証済みユーザーのみアクセス可能。
 *
 * @returns 共用情報の配列、エラー時は空配列
 */
export async function getSharedInfo(): Promise<SharedInfo[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("shared_info")
      .select("id, info_key, title, content, notes, display_order, updated_by, created_at, updated_at")
      .order("display_order", { ascending: true });

    if (error || !data) {
      if (error) logError(error, { action: "getSharedInfo", userId: user.id });
      return [];
    }

    return data as SharedInfo[];
  } catch (error) {
    logError(error, { action: "getSharedInfo" });
    return [];
  }
}

/**
 * 特定のキーの共用情報を取得する
 *
 * @param key - 情報のキー（例: 'mailbox_code', 'address'）
 * @returns 共用情報、見つからない場合はnull
 */
export async function getSharedInfoByKey(key: string): Promise<SharedInfo | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("shared_info")
      .select("id, info_key, title, content, notes, display_order, updated_by, created_at, updated_at")
      .eq("info_key", key)
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        logError(error, { action: "getSharedInfoByKey", userId: user.id, metadata: { key } });
      }
      return null;
    }

    return data as SharedInfo;
  } catch (error) {
    logError(error, { action: "getSharedInfoByKey" });
    return null;
  }
}
