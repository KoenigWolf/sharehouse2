"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { wifiInfoSchema } from "@/domain/validation/wifi";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { isValidUUID } from "@/lib/security";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { requireAdmin } from "@/lib/admin/check";
import type { WifiInfo, WifiInfoInput } from "@/domain/wifi";

/**
 * Response types
 */
type UpdateResponse = { success: true } | { error: string };

/**
 * WiFi情報を全件取得する
 *
 * display_order昇順でソートして返す。
 * 認証済みユーザーのみアクセス可能。
 *
 * @returns WiFi情報の配列、エラー時は空配列
 */
export async function getWifiInfo(): Promise<WifiInfo[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("wifi_info")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data) {
      if (error) logError(error, { action: "getWifiInfo", userId: user.id });
      return [];
    }

    return data as WifiInfo[];
  } catch (error) {
    logError(error, { action: "getWifiInfo" });
    return [];
  }
}

/**
 * WiFi情報を新規作成する（管理者専用）
 *
 * enforceAllowedOrigin -> 認証チェック -> 管理者権限チェック -> バリデーション -> 挿入
 *
 * @param data - WiFi情報の入力データ
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function createWifiInfo(data: WifiInfoInput): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "createWifiInfo");
  if (originError) {
    return { error: originError };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    const adminError = await requireAdmin(t);
    if (adminError) {
      return { error: adminError };
    }

    const parsed = wifiInfoSchema.safeParse(data);
    if (!parsed.success) {
      return { error: t("errors.invalidInput") };
    }

    const { error } = await supabase.from("wifi_info").insert({
      ...parsed.data,
      updated_by: user.id,
    });

    if (error) {
      logError(error, { action: "createWifiInfo", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterWifiUpdate();

    return { success: true };
  } catch (error) {
    logError(error, { action: "createWifiInfo" });
    return { error: t("errors.serverError") };
  }
}

/**
 * WiFi情報を更新する（管理者専用）
 *
 * enforceAllowedOrigin -> 認証チェック -> 管理者権限チェック -> バリデーション -> 更新
 *
 * @param id - 更新対象のWiFi情報ID（UUID形式）
 * @param data - WiFi情報の入力データ
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function updateWifiInfo(id: string, data: WifiInfoInput): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "updateWifiInfo");
  if (originError) {
    return { error: originError };
  }

  if (!isValidUUID(id)) {
    return { error: t("errors.invalidInput") };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    const adminError = await requireAdmin(t);
    if (adminError) {
      return { error: adminError };
    }

    const parsed = wifiInfoSchema.safeParse(data);
    if (!parsed.success) {
      return { error: t("errors.invalidInput") };
    }

    const { error } = await supabase
      .from("wifi_info")
      .update({
        ...parsed.data,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      logError(error, { action: "updateWifiInfo", userId: user.id, metadata: { id } });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterWifiUpdate();

    return { success: true };
  } catch (error) {
    logError(error, { action: "updateWifiInfo" });
    return { error: t("errors.serverError") };
  }
}

/**
 * WiFi情報を削除する（管理者専用）
 *
 * enforceAllowedOrigin -> 認証チェック -> 管理者権限チェック -> UUID検証 -> 削除
 *
 * @param id - 削除対象のWiFi情報ID（UUID形式）
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function deleteWifiInfo(id: string): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "deleteWifiInfo");
  if (originError) {
    return { error: originError };
  }

  if (!isValidUUID(id)) {
    return { error: t("errors.invalidInput") };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    const adminError = await requireAdmin(t);
    if (adminError) {
      return { error: adminError };
    }

    const { error } = await supabase
      .from("wifi_info")
      .delete()
      .eq("id", id);

    if (error) {
      logError(error, { action: "deleteWifiInfo", userId: user.id, metadata: { id } });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterWifiUpdate();

    return { success: true };
  } catch (error) {
    logError(error, { action: "deleteWifiInfo" });
    return { error: t("errors.serverError") };
  }
}
