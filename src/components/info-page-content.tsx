"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Wifi,
  Trash2,
  Copy,
  Check,
  MapPin,
  Info,
  Building2,
  Mailbox,
  BookOpen,
  Router,
  AlertTriangle,
  Server,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/hooks/use-i18n";
import { GarbageScheduleView } from "@/components/garbage-schedule-view";
import { GarbageAdminPanel } from "@/components/garbage-admin-panel";
import type { GarbageSchedule, GarbageDutyWithProfile } from "@/domain/garbage";
import type { SharedInfo } from "@/domain/shared-info";
import { staggerContainer, staggerItem } from "@/lib/animation";
import { cn } from "@/lib/utils";

// =============================================================================
// WiFi Configuration - Single Source of Truth
// =============================================================================

const WIFI_CONFIG = {
  password: "Koishikawa190808",
  security: "WPA2",
  isHidden: true,
  ssids: [
    { name: "Yamamomo-1", band: "2.4GHz / 5GHz", recommended: true },
    { name: "Yamamomo-2", band: "2.4GHz", recommended: false },
    { name: "Yamamomo-3", band: "5GHz", recommended: false },
  ],
  accessPoints: [
    { id: "ap1", name: "親機1", location: "玄関", model: "PR-500MI" },
    { id: "ap2", name: "親機2", location: "居間", model: "WEM-1266" },
    { id: "ap3", name: "中継機", location: "廊下", model: "WEM-1266" },
  ],
  devices: [
    {
      id: "pr500mi",
      name: "親機1",
      model: "NTT PR-500MI",
      year: "2018年10月",
      mac: "58:52:8A:60:C2:C7",
      pin: "97191223",
      initialSsids: [
        { name: "pr500m-60c2c7-1", key: "f8e0219cc78af" },
        { name: "pr500m-60c2c7-2", key: "3eb0b6aa0eca3" },
        { name: "pr500m-60c2c7-3", key: "84550a5f529ec" },
      ],
    },
    {
      id: "wem1266",
      name: "親機2・中継機",
      model: "Buffalo WEM-1266",
      settingsUrl: "192.168.11.210",
      adminUser: "admin",
      adminPass: "password",
      mac: "50C4DD2980E0",
    },
  ],
  notes: [
    {
      type: "warning" as const,
      titleKey: "info.wifiNoteRouterTitle" as const,
      contentKey: "info.wifiNoteRouterContent" as const,
    },
    {
      type: "info" as const,
      titleKey: "info.wifiNoteRebootTitle" as const,
      contentKey: "info.wifiNoteRebootContent" as const,
    },
  ],
} as const;

// =============================================================================
// Building Info - Single Source of Truth
// =============================================================================

const BUILDING_INFO = {
  mailbox: {
    code: '左に2回「4」、右に1回「8」',
  },
  address: "〒112-0002 東京都文京区小石川1-9-8",
} as const;

// =============================================================================
// Types
// =============================================================================

interface InfoPageContentProps {
  schedule: GarbageSchedule[];
  duties: GarbageDutyWithProfile[];
  sharedInfos: SharedInfo[];
  isAdmin: boolean;
  currentUserId?: string;
}

// =============================================================================
// Shared Components
// =============================================================================

const CopyButton = memo(function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    },
    [value]
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className={cn(
        "w-10 h-10 rounded-full transition-all duration-200",
        copied
          ? "bg-green-500/10 text-green-600"
          : "hover:bg-muted text-muted-foreground",
        className
      )}
      aria-label={label}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <m.div
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            <Check size={14} strokeWidth={2.5} />
          </m.div>
        ) : (
          <m.div
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            <Copy size={14} />
          </m.div>
        )}
      </AnimatePresence>
    </Button>
  );
});
CopyButton.displayName = "CopyButton";

// =============================================================================
// Tab 1: Quick Access (WiFi + Mailbox + Address)
// =============================================================================

function QuickAccessTab() {
  const t = useI18n();

  return (
    <m.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* WiFi Connection Card */}
      <m.section variants={staggerItem}>
        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <Wifi size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            {t("info.wifi")}
          </h3>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
          {/* Stealth Warning */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t("info.wifiStealthNote")}
            </p>
          </div>

          {/* Password */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound size={14} className="text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t("info.password")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-lg font-mono font-bold text-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                {WIFI_CONFIG.password}
              </code>
              <CopyButton value={WIFI_CONFIG.password} label={t("common.copy")} />
            </div>
          </div>

          {/* SSID List */}
          <div className="pt-4 border-t border-border/40">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">
              {t("info.wifiNetworks")}
            </span>
            <div className="space-y-2">
              {WIFI_CONFIG.ssids.map((ssid) => (
                <div
                  key={ssid.name}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    ssid.recommended
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/50"
                      : "bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Wifi size={14} className={ssid.recommended ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-sm">{ssid.name}</span>
                        {ssid.recommended && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                            {t("info.wifiRecommended")}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{ssid.band}</span>
                    </div>
                  </div>
                  <CopyButton value={ssid.name} label={t("common.copy")} className="w-8 h-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </m.section>

      {/* Mailbox & Address */}
      <m.section variants={staggerItem}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mailbox */}
          <div className="rounded-xl border border-border/60 bg-card p-4 hover:border-border transition-colors">
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <Mailbox size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {t("info.mailbox")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                {BUILDING_INFO.mailbox.code}
              </span>
              <CopyButton value={BUILDING_INFO.mailbox.code} label={t("common.copy")} />
            </div>
          </div>

          {/* Address */}
          <div className="rounded-xl border border-border/60 bg-card p-4 hover:border-border transition-colors">
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <MapPin size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {t("info.address")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                {BUILDING_INFO.address}
              </span>
              <CopyButton value={BUILDING_INFO.address} label={t("common.copy")} />
            </div>
          </div>
        </div>
      </m.section>
    </m.div>
  );
}

// =============================================================================
// Tab 2: Garbage (Schedule + Duties + Admin)
// =============================================================================

interface GarbageTabProps {
  schedule: GarbageSchedule[];
  duties: GarbageDutyWithProfile[];
  isAdmin: boolean;
  currentUserId?: string;
}

function GarbageTab({ schedule, duties, isAdmin, currentUserId }: GarbageTabProps) {
  return (
    <m.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <m.div variants={staggerItem}>
        <GarbageScheduleView
          schedule={schedule}
          duties={duties}
          currentUserId={currentUserId}
        />
      </m.div>

      {isAdmin && (
        <m.div variants={staggerItem} className="pt-8 border-t border-border">
          <GarbageAdminPanel schedule={schedule} />
        </m.div>
      )}
    </m.div>
  );
}

// =============================================================================
// Tab 3: Building Guide (Technical Info + General Info)
// =============================================================================

interface BuildingGuideTabProps {
  sharedInfos: SharedInfo[];
}

function BuildingGuideTab({ sharedInfos }: BuildingGuideTabProps) {
  const t = useI18n();

  const commonInfos = useMemo(
    () =>
      sharedInfos.filter(
        (info) =>
          info.floor === null &&
          !info.info_key.startsWith("mailbox_code") &&
          !info.info_key.startsWith("address")
      ),
    [sharedInfos]
  );

  return (
    <m.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* WiFi Technical Section */}
      <m.section variants={staggerItem} className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Router size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            {t("info.wifiConfig")}
          </h3>
        </div>

        {/* Access Point Locations */}
        <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <Server size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t("info.wifiAccessPoints")}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {WIFI_CONFIG.accessPoints.map((ap) => (
              <div key={ap.id} className="bg-muted/30 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">{ap.location}</div>
                <div className="font-medium text-sm">{ap.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{ap.model}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hardware Details */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-4 sm:px-5 pt-4 pb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t("info.wifiHardwareDetails")}
            </span>
          </div>
          <Accordion type="single" collapsible className="px-4 sm:px-5">
            {WIFI_CONFIG.devices.map((device) => (
              <AccordionItem key={device.id} value={device.id}>
                <AccordionTrigger className="text-sm">
                  <span>
                    <span className="font-medium">{device.name}</span>
                    <span className="text-muted-foreground ml-2">({device.model})</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    {"year" in device && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("info.wifiManufactureDate")}</span>
                        <span className="font-mono">{device.year}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("info.wifiMacAddress")}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs">{device.mac}</span>
                        <CopyButton value={device.mac} label={t("common.copy")} className="w-7 h-7" />
                      </div>
                    </div>
                    {"pin" in device && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">PIN</span>
                        <span className="font-mono">{device.pin}</span>
                      </div>
                    )}
                    {"settingsUrl" in device && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("info.wifiSettingsUrl")}</span>
                          <span className="font-mono text-xs">{device.settingsUrl}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("info.wifiAdminUser")}</span>
                          <span className="font-mono">{device.adminUser}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("info.wifiAdminPass")}</span>
                          <span className="font-mono">{device.adminPass}</span>
                        </div>
                      </>
                    )}
                    {"initialSsids" in device && (
                      <div className="pt-2 border-t border-border/40">
                        <div className="text-xs text-muted-foreground mb-2">
                          {t("info.wifiInitialSsids")}
                        </div>
                        <div className="space-y-1">
                          {device.initialSsids.map((ssid) => (
                            <div key={ssid.name} className="flex justify-between text-xs">
                              <span className="font-mono">{ssid.name}</span>
                              <span className="font-mono text-muted-foreground">{ssid.key}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Usage Notes */}
        <div className="space-y-3">
          {WIFI_CONFIG.notes.map((note, index) => (
            <div
              key={index}
              className={cn(
                "p-4 rounded-xl border flex gap-3",
                note.type === "warning"
                  ? "border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50"
                  : "border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/50"
              )}
            >
              <div className={cn(
                "mt-0.5 flex-shrink-0",
                note.type === "warning"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-blue-600 dark:text-blue-400"
              )}>
                {note.type === "warning" ? <AlertTriangle size={16} /> : <Info size={16} />}
              </div>
              <div>
                <div className={cn(
                  "text-xs font-bold uppercase tracking-wider mb-1",
                  note.type === "warning"
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-blue-700 dark:text-blue-300"
                )}>
                  {t(note.titleKey)}
                </div>
                <p className="text-sm text-foreground/90">{t(note.contentKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </m.section>

      {/* General Information */}
      {commonInfos.length > 0 && (
        <m.section variants={staggerItem}>
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <Building2 size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              {t("info.generalInformation")}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commonInfos.map((info) => (
              <div
                key={info.id}
                className="p-4 sm:p-5 rounded-xl border border-border/60 bg-card hover:border-border transition-colors"
              >
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <Info size={18} />
                  <h4 className="text-xs font-bold uppercase tracking-wider">{info.title}</h4>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {info.content}
                </p>
                {info.notes && (
                  <p className="mt-3 text-xs text-muted-foreground bg-muted/30 p-2 rounded border border-border/20">
                    {info.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </m.section>
      )}
    </m.div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function InfoPageContent({
  schedule,
  duties,
  sharedInfos,
  isAdmin,
  currentUserId,
}: InfoPageContentProps) {
  const t = useI18n();

  return (
    <Tabs defaultValue="quick" className="w-full">
      <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl mb-6">
        <TabsTrigger
          value="quick"
          className="flex-1 sm:flex-none gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <Wifi size={16} />
          <span>{t("info.tabQuickAccess")}</span>
        </TabsTrigger>
        <TabsTrigger
          value="garbage"
          className="flex-1 sm:flex-none gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <Trash2 size={16} />
          <span>{t("info.tabGarbage")}</span>
        </TabsTrigger>
        <TabsTrigger
          value="guide"
          className="flex-1 sm:flex-none gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <BookOpen size={16} />
          <span>{t("info.tabBuilding")}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="quick" className="mt-0">
        <QuickAccessTab />
      </TabsContent>

      <TabsContent value="garbage" className="mt-0">
        <GarbageTab
          schedule={schedule}
          duties={duties}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
        />
      </TabsContent>

      <TabsContent value="guide" className="mt-0">
        <BuildingGuideTab sharedInfos={sharedInfos} />
      </TabsContent>
    </Tabs>
  );
}
