"use client";

import { Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { SectionLabel } from "./form-fields";
import { ICON_SIZE, ICON_STROKE } from "@/lib/constants/icons";
import { useI18n } from "@/hooks/use-i18n";
import type { NotificationKey } from "@/domain/notification";

interface NotificationSettingsData {
  notify_tea_time: boolean;
  notify_garbage_duty: boolean;
  notify_new_photos: boolean;
}

interface SettingsSectionProps {
  teaTimeEnabled: boolean;
  isTeaTimeLoading: boolean;
  onTeaTimeToggle: (checked: boolean) => void;
  notificationSettings: NotificationSettingsData;
  notificationLoading: NotificationKey | null;
  onNotificationToggle: (key: NotificationKey, checked: boolean) => void;
}

export function SettingsSection({
  teaTimeEnabled,
  isTeaTimeLoading,
  onTeaTimeToggle,
  notificationSettings,
  notificationLoading,
  onNotificationToggle,
}: SettingsSectionProps) {
  const t = useI18n();

  const notificationItems: Array<{
    key: NotificationKey;
    label: string;
    description: string;
  }> = [
    {
      key: "notify_tea_time",
      label: t("notifications.teaTime"),
      description: t("notifications.teaTimeDescription"),
    },
    {
      key: "notify_garbage_duty",
      label: t("notifications.garbageDuty"),
      description: t("notifications.garbageDutyDescription"),
    },
    {
      key: "notify_new_photos",
      label: t("notifications.newPhotos"),
      description: t("notifications.newPhotosDescription"),
    },
  ];

  return (
    <div className="premium-surface rounded-[2rem] p-8 sm:p-10 shadow-sm border border-border/50 space-y-8">
      <SectionLabel
        label={`${t("teaTime.title")} & ${t("notifications.sectionTitle")}`}
        icon={<Bell size={ICON_SIZE.md} strokeWidth={ICON_STROKE.normal} />}
      />
      <div className="divide-y divide-border/50">
        <div className="flex items-center justify-between py-5 group first:pt-0">
          <div className="space-y-1">
            <p className="text-[13px] font-bold text-foreground/80 tracking-wide">
              {t("teaTime.title")}
            </p>
            <p
              className={`text-[11px] font-medium ${
                teaTimeEnabled ? "text-brand-500" : "text-muted-foreground"
              }`}
            >
              {teaTimeEnabled ? t("teaTime.participating") : t("teaTime.notParticipating")}
            </p>
          </div>
          {isTeaTimeLoading ? (
            <Spinner size="sm" variant="dark" />
          ) : (
            <Switch
              checked={teaTimeEnabled}
              onCheckedChange={onTeaTimeToggle}
              disabled={isTeaTimeLoading}
              className="scale-110 data-[state=checked]:bg-brand-500"
            />
          )}
        </div>

        {notificationItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-5 group">
            <div className="space-y-1">
              <p className="text-[13px] font-bold text-foreground/80 tracking-wide">
                {item.label}
              </p>
              <p className="text-[11px] font-medium text-muted-foreground">{item.description}</p>
            </div>
            {notificationLoading === item.key ? (
              <Spinner size="sm" variant="dark" />
            ) : (
              <Switch
                checked={notificationSettings[item.key]}
                onCheckedChange={(checked) => onNotificationToggle(item.key, checked)}
                disabled={notificationLoading === item.key}
                className="scale-110 data-[state=checked]:bg-brand-500"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
