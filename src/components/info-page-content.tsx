"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { useI18n } from "@/hooks/use-i18n";
import { WifiInfoList } from "@/components/wifi-info-list";
import { GarbageScheduleView } from "@/components/garbage-schedule-view";
import { GarbageAdminPanel } from "@/components/garbage-admin-panel";
import type { WifiInfo } from "@/domain/wifi";
import type { GarbageSchedule, GarbageDutyWithProfile } from "@/domain/garbage";

type TabId = "wifi" | "garbage";

interface InfoPageContentProps {
  wifiInfos: WifiInfo[];
  schedule: GarbageSchedule[];
  duties: GarbageDutyWithProfile[];
  isAdmin: boolean;
  currentUserId: string;
}

/**
 * 情報ページのクライアント側コンテンツ
 *
 * Wi-Fi情報タブとゴミ出しスケジュールタブを切り替え表示する。
 * 管理者の場合はゴミ出し管理パネルも表示する。
 *
 * @param props.wifiInfos - WiFi情報の配列
 * @param props.schedule - ゴミ出しスケジュールの配列
 * @param props.duties - 直近の当番（プロフィール付き）
 * @param props.isAdmin - 管理者かどうか
 * @param props.currentUserId - ログインユーザーのID
 */
export function InfoPageContent({
  wifiInfos,
  schedule,
  duties,
  isAdmin,
  currentUserId,
}: InfoPageContentProps) {
  const [activeTab, setActiveTab] = useState<TabId>("wifi");
  const t = useI18n();

  const tabs: { id: TabId; label: string }[] = [
    { id: "wifi", label: t("info.tabWifi") },
    { id: "garbage", label: t("info.tabGarbage") },
  ];

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-baseline justify-between mb-5 sm:mb-6">
        <h1 className="text-xl text-[#1a1a1a] tracking-wide font-light">
          {t("info.title")}
        </h1>
      </div>

      {/* タブ */}
      <div className="flex border-b border-[#e5e5e5] mb-5 sm:mb-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="relative px-4 py-2.5 text-sm tracking-wide transition-colors group"
            >
              <span
                className={
                  isActive
                    ? "text-[#1a1a1a] font-medium"
                    : "text-[#a3a3a3] group-hover:text-[#737373]"
                }
              >
                {tab.label}
              </span>
              {isActive && (
                <m.span
                  layoutId="info-tab-underline"
                  className="absolute bottom-0 left-4 right-4 h-px bg-[#1a1a1a]"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* タブコンテンツ */}
      <m.div
        key={activeTab}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "wifi" && (
          <WifiInfoList wifiInfos={wifiInfos} isAdmin={isAdmin} />
        )}
        {activeTab === "garbage" && (
          <div className="space-y-6">
            <GarbageScheduleView
              schedule={schedule}
              duties={duties}
              currentUserId={currentUserId}
            />
            {isAdmin && <GarbageAdminPanel schedule={schedule} />}
          </div>
        )}
      </m.div>
    </div>
  );
}
