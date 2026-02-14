"use client";

import { memo, useState, useCallback } from "react";
import { m } from "framer-motion";
import { Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/use-i18n";
import { updateTeaTimeSetting } from "@/lib/tea-time/actions";
import { updateNotificationSetting } from "@/lib/notifications/actions";
import type { NotificationKey } from "@/domain/notification";

// Animation config with natural easing
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

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
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Section header */}
      <m.div variants={itemVariants} className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Bell size={18} className="text-brand-500" />
          </div>
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            {t("notifications.sectionTitle")}
          </h2>
        </div>
        <div className="flex-1 h-px bg-border" />
      </m.div>

      {/* Settings card */}
      <m.div
        variants={itemVariants}
        className="premium-surface rounded-2xl sm:rounded-3xl border border-border/50 overflow-hidden"
      >
        {/* Tea Time toggle - min 64px height for touch target */}
        <div className="flex items-center justify-between min-h-[72px] px-6 py-5 border-b border-border/50">
          <div className="space-y-1 pr-4 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {t("teaTime.title")}
            </p>
            <p className={`text-xs font-medium ${teaTimeEnabled ? "text-brand-500" : "text-muted-foreground"}`}>
              {teaTimeEnabled ? t("teaTime.participating") : t("teaTime.notParticipating")}
            </p>
          </div>
          <div className="w-12 flex items-center justify-center">
            {isTeaTimeLoading ? (
              <Spinner size="sm" variant="dark" />
            ) : (
              <Switch
                checked={teaTimeEnabled}
                onCheckedChange={handleTeaTimeToggle}
                disabled={isTeaTimeLoading}
                className="scale-110 data-[state=checked]:bg-brand-500"
              />
            )}
          </div>
        </div>

        {/* Notification toggles */}
        {notificationItems.map((item, index) => (
          <m.div
            key={item.key}
            variants={itemVariants}
            className={`flex items-center justify-between min-h-[72px] px-6 py-5 ${
              index < notificationItems.length - 1 ? "border-b border-border/50" : ""
            }`}
          >
            <div className="space-y-1 pr-4 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {t(item.labelKey as Parameters<typeof t>[0])}
              </p>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                {t(item.descriptionKey as Parameters<typeof t>[0])}
              </p>
            </div>
            <div className="w-12 flex items-center justify-center">
              {notificationLoading === item.key ? (
                <Spinner size="sm" variant="dark" />
              ) : (
                <Switch
                  checked={notificationSettings[item.key]}
                  onCheckedChange={(checked) => handleNotificationToggle(item.key, checked)}
                  disabled={notificationLoading === item.key}
                  className="scale-110 data-[state=checked]:bg-brand-500"
                />
              )}
            </div>
          </m.div>
        ))}
      </m.div>
    </m.section>
  );
});
