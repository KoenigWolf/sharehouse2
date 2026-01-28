"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { enforceAllowedOrigin } from "@/lib/security/request";
import type { PushSubscriptionInput, NotificationPayload } from "@/domain/push";

/**
 * Response types
 */
type PushResponse = { success: true } | { error: string };

/**
 * プッシュ通知のサブスクリプションを保存する
 *
 * オリジン検証 → 認証確認 → endpoint による upsert の順に処理。
 * 同一 endpoint が既に存在する場合は p256dh と auth_key を更新する。
 *
 * @param subscription - endpoint, p256dh, auth_key を含むサブスクリプション情報
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function savePushSubscription(
  subscription: PushSubscriptionInput
): Promise<PushResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "savePushSubscription");
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

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth_key: subscription.auth_key,
      },
      {
        onConflict: "endpoint",
      }
    );

    if (error) {
      logError(error, { action: "savePushSubscription", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    return { success: true };
  } catch (error) {
    logError(error, { action: "savePushSubscription" });
    return { error: t("errors.serverError") };
  }
}

/**
 * プッシュ通知のサブスクリプションを削除する
 *
 * オリジン検証 → 認証確認 → endpoint と user_id の一致するレコードを削除する。
 *
 * @param endpoint - 削除対象のサブスクリプション endpoint URL
 * @returns 成功時 `{ success: true }`、失敗時 `{ error }`
 */
export async function removePushSubscription(
  endpoint: string
): Promise<PushResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "removePushSubscription");
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

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("user_id", user.id);

    if (error) {
      logError(error, { action: "removePushSubscription", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    return { success: true };
  } catch (error) {
    logError(error, { action: "removePushSubscription" });
    return { error: t("errors.serverError") };
  }
}

/**
 * 指定ユーザーの全デバイスにプッシュ通知を送信する（内部用）
 *
 * ユーザーの全サブスクリプションを取得し、web-push で各デバイスに送信する。
 * 410/404 レスポンスの場合は期限切れサブスクリプションとして自動削除する。
 * fire-and-forget スタイルで使用することを想定。
 *
 * @param userId - 通知対象のユーザーID
 * @param payload - title, body, url を含む通知ペイロード
 */
export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  try {
    const supabase = await createClient();

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth_key")
      .eq("user_id", userId);

    if (error) {
      logError(error, { action: "sendPushNotification.fetch", userId });
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    const webpush = await import("web-push");
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || "mailto:admin@example.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
      process.env.VAPID_PRIVATE_KEY || ""
    );

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth_key,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
      } catch (err: unknown) {
        const statusCode =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode: number }).statusCode
            : undefined;

        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired or invalid — remove it
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint)
            .eq("user_id", userId);
        } else {
          logError(err, {
            action: "sendPushNotification.send",
            userId,
            metadata: { endpoint: sub.endpoint },
          });
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    logError(error, { action: "sendPushNotification", userId });
  }
}
