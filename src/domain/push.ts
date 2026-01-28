export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  created_at: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}
