export interface NotificationSettings {
  user_id: string;
  notify_tea_time: boolean;
  notify_garbage_duty: boolean;
  notify_new_photos: boolean;
}

export type NotificationKey = "notify_tea_time" | "notify_garbage_duty" | "notify_new_photos";

export const DEFAULT_NOTIFICATION_SETTINGS: Omit<NotificationSettings, "user_id"> = {
  notify_tea_time: true,
  notify_garbage_duty: true,
  notify_new_photos: true,
};
