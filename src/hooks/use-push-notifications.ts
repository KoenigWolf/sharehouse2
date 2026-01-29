"use client";

import { useCallback, useEffect, useState } from "react";
import {
  savePushSubscription,
  removePushSubscription,
} from "@/lib/push/actions";

/**
 * Base64 URL エンコードされた文字列を Uint8Array に変換する
 *
 * VAPID 公開鍵を PushManager.subscribe の applicationServerKey に
 * 渡す際に必要な変換処理。
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Web Push 通知の購読管理フック
 *
 * ブラウザの Push API 対応状況の検出、通知パーミッションの確認、
 * Service Worker 登録、サブスクリプションの購読・解除を管理する。
 *
 * @returns isSupported - ブラウザが Push API に対応しているか
 * @returns permission - 現在の通知パーミッション状態
 * @returns isSubscribed - プッシュ通知を購読中かどうか
 * @returns subscribe - プッシュ通知を購読する関数
 * @returns unsubscribe - プッシュ通知の購読を解除する関数
 */
export function usePushNotifications() {
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  const [permission, setPermission] = useState<NotificationPermission>(
    () => (supported ? Notification.permission : "default")
  );
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!supported) {
      return;
    }

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        setIsSubscribed(subscription !== null);
      })
      .catch(() => {
        setIsSubscribed(false);
      });
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) {
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result !== "granted") {
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    const subscriptionJson = subscription.toJSON();
    const p256dh = subscriptionJson.keys?.p256dh || "";
    const auth = subscriptionJson.keys?.auth || "";

    await savePushSubscription({
      endpoint: subscription.endpoint,
      p256dh,
      auth_key: auth,
    });

    setIsSubscribed(true);
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) {
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      setIsSubscribed(false);
      return;
    }

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await removePushSubscription(endpoint);

    setIsSubscribed(false);
  }, [supported]);

  return { isSupported: supported, permission, isSubscribed, subscribe, unsubscribe };
}
