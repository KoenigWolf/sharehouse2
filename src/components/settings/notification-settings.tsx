"use client";

import { memo, useState, useCallback } from "react";
import { m } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/use-i18n";
import { updateTeaTimeSetting } from "@/lib/tea-time/actions";
import { updateNotificationSetting } from "@/lib/notifications/actions";
import type { NotificationKey } from "@/domain/notification";

interface NotificationSettingsProps {
  initialTeaTimeEnabled: boolean;
  initialNotificationSettings: {
    notify_tea_time: boolean;
    notify_garbage_duty: boolean;
    notify_new_photos: boolean;
  };
}

export const NotificationSettings = memo(function NotificationSettings({
  initialTeaTimeEnabled,
  initialNotificationSettings,
}: NotificationSettingsProps) {
  const t = useI18n();
  const [isTeaTimeLoading, setIsTeaTimeLoading] = useState(false);
  const [teaTimeEnabled, setTeaTimeEnabled] = useState(initialTeaTimeEnabled);
  const [notificationSettings, setNotificationSettings] = useState(initialNotificationSettings);
  const [notificationLoading, setNotificationLoading] = useState<NotificationKey | null>(null);

  const handleTeaTimeToggle = useCallback(async (checked: boolean) => {
    setIsTeaTimeLoading(true);
    setTeaTimeEnabled(checked);

    const result = await updateTeaTimeSetting(checked);

    if ("error" in result) {
      setTeaTimeEnabled(!checked);
    }

    setIsTeaTimeLoading(false);
  }, []);

  const handleNotificationToggle = useCallback(async (key: NotificationKey, checked: boolean) => {
    setNotificationLoading(key);
    setNotificationSettings((prev) => ({ ...prev, [key]: checked }));

    const result = await updateNotificationSetting(key, checked);

    if ("error" in result) {
      setNotificationSettings((prev) => ({ ...prev, [key]: !checked }));
    }

    setNotificationLoading(null);
  }, []);

  const notificationItems: {
    key: NotificationKey;
    labelKey: string;
    descriptionKey: string;
  }[] = [
    {
      key: "notify_tea_time",
      labelKey: "notifications.teaTime",
      descriptionKey: "notifications.teaTimeDescription",
    },
    {
      key: "notify_garbage_duty",
      labelKey: "notifications.garbageDuty",
      descriptionKey: "notifications.garbageDutyDescription",
    },
    {
      key: "notify_new_photos",
      labelKey: "notifications.newPhotos",
      descriptionKey: "notifications.newPhotosDescription",
    },
  ];

  return (
    <m.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h2 className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase whitespace-nowrap">
            {t("notifications.sectionTitle")}
          </h2>
        </div>
        <div className="flex-1 h-px bg-secondary" />
      </div>

      <div className="premium-surface rounded-[2rem] p-6 sm:p-8 shadow-sm border border-border/50">
        <div className="divide-y divide-border/50">
          {/* Tea Time Participation */}
          <div className="flex items-center justify-between py-5 first:pt-0">
            <div className="space-y-1 pr-4">
              <p className="text-[13px] font-bold text-foreground/80 tracking-wide">
                {t("teaTime.title")}
              </p>
              <p className={`text-[11px] font-medium ${teaTimeEnabled ? "text-brand-500" : "text-muted-foreground"}`}>
                {teaTimeEnabled ? t("teaTime.participating") : t("teaTime.notParticipating")}
              </p>
            </div>
            {isTeaTimeLoading ? (
              <Spinner size="sm" variant="dark" />
            ) : (
              <Switch
                checked={teaTimeEnabled}
                onCheckedChange={handleTeaTimeToggle}
                disabled={isTeaTimeLoading}
                className="scale-110 data-[state=checked]:bg-brand-500 shrink-0"
              />
            )}
          </div>

          {/* Notification Items */}
          {notificationItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-5 last:pb-0">
              <div className="space-y-1 pr-4">
                <p className="text-[13px] font-bold text-foreground/80 tracking-wide">
                  {t(item.labelKey as Parameters<typeof t>[0])}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground">
                  {t(item.descriptionKey as Parameters<typeof t>[0])}
                </p>
              </div>
              {notificationLoading === item.key ? (
                <Spinner size="sm" variant="dark" />
              ) : (
                <Switch
                  checked={notificationSettings[item.key]}
                  onCheckedChange={(checked) => handleNotificationToggle(item.key, checked)}
                  disabled={notificationLoading === item.key}
                  className="scale-110 data-[state=checked]:bg-brand-500 shrink-0"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </m.section>
  );
});
