"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { enforceAllowedOrigin } from "@/lib/security/request";
import type { NotificationSettings, NotificationKey } from "@/domain/notification";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/domain/notification";

type UpdateResponse = { success: true } | { error: string };

/**
 * ログインユーザーの通知設定を取得する
 *
 * レコードが未作成の場合はデフォルト値を返す。
 *
 * @returns 通知設定データ
 */
export async function getNotificationSettings(): Promise<Omit<NotificationSettings, "user_id">> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }

    const { data, error } = await supabase
      .from("notification_settings")
      .select("notify_tea_time, notify_garbage_duty, notify_new_photos")
      .eq("user_id", user.id)
      .single();

    // PGRST116 = no rows returned
    if (error && error.code !== "PGRST116") {
      logError(error, { action: "getNotificationSettings", userId: user.id });
      return DEFAULT_NOTIFICATION_SETTINGS;
    }

    if (!data) {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }

    return {
      notify_tea_time: data.notify_tea_time,
      notify_garbage_duty: data.notify_garbage_duty,
      notify_new_photos: data.notify_new_photos,
    };
  } catch (error) {
    logError(error, { action: "getNotificationSettings" });
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

const VALID_KEYS: NotificationKey[] = ["notify_tea_time", "notify_garbage_duty", "notify_new_photos"];

/**
 * 通知設定の個別トグルを更新する（upsert）
 *
 * @param key - 更新する設定キー
 * @param value - 新しい値
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function updateNotificationSetting(
  key: NotificationKey,
  value: boolean,
): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "updateNotificationSetting");
  if (originError) {
    return { error: originError };
  }

  if (!VALID_KEYS.includes(key)) {
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

    const { error } = await supabase.from("notification_settings").upsert(
      {
        user_id: user.id,
        [key]: value,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

    if (error) {
      logError(error, { action: "updateNotificationSetting", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    return { success: true };
  } catch (error) {
    logError(error, { action: "updateNotificationSetting" });
    return { error: t("errors.serverError") };
  }
}
