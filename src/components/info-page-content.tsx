"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Wifi,
  Trash2,
  Copy,
  Check,
  MapPin,
  Signal,
  Info,
  Zap,
  Building2,
  Mailbox,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useI18n } from "@/hooks/use-i18n";
import { GarbageScheduleView } from "@/components/garbage-schedule-view";
import { GarbageAdminPanel } from "@/components/garbage-admin-panel";
import type { WifiInfo } from "@/domain/wifi";
import type { GarbageSchedule, GarbageDutyWithProfile } from "@/domain/garbage";
import type { SharedInfo } from "@/domain/shared-info";
import { staggerContainer, staggerItem } from "@/lib/animation";
import { cn } from "@/lib/utils";

interface InfoPageContentProps {
  wifiInfos: WifiInfo[];
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
// Tab 1: Quick Access (WiFi, Mailbox, Address)
// =============================================================================

interface QuickAccessTabProps {
  wifiInfos: WifiInfo[];
  sharedInfos: SharedInfo[];
}

function QuickAccessTab({ wifiInfos, sharedInfos }: QuickAccessTabProps) {
  const t = useI18n();

  // Group WiFi by floor
  const wifiByFloor = useMemo(() => {
    const grouped = new Map<number, WifiInfo[]>();
    for (const wifi of wifiInfos) {
      const floor = wifi.floor ?? 0;
      const existing = grouped.get(floor) ?? [];
      existing.push(wifi);
      grouped.set(floor, existing);
    }
    // Sort floors (0 = shared goes last)
    return Array.from(grouped.entries()).sort((a, b) => {
      if (a[0] === 0) return 1;
      if (b[0] === 0) return -1;
      return a[0] - b[0];
    });
  }, [wifiInfos]);

  // Extract mailbox codes and addresses
  const mailboxCodes = useMemo(
    () => sharedInfos.filter((info) => info.info_key.startsWith("mailbox_code")),
    [sharedInfos]
  );

  const addresses = useMemo(
    () => sharedInfos.filter((info) => info.info_key.startsWith("address")),
    [sharedInfos]
  );

  return (
    <m.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* WiFi Section */}
      {wifiByFloor.length > 0 && (
        <m.section variants={staggerItem}>
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <Wifi size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              {t("info.wifi")}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wifiByFloor.map(([floor, wifiList]) => {
              const floorLabel = floor === 0 ? t("info.sharedFacilities") : `${floor}F`;
              const passwords = wifiList.map((w) => w.password).filter(Boolean);
              const uniquePasswords = [...new Set(passwords)];
              const hasCommonPassword = uniquePasswords.length === 1;
              const commonPassword = hasCommonPassword ? uniquePasswords[0] : null;

              return (
                <div
                  key={floor}
                  className="rounded-xl border border-border/60 bg-card p-4 hover:border-border transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {floorLabel}
                    </span>
                    <Signal size={14} className="text-emerald-500" />
                  </div>

                  <div className="space-y-2 mb-3">
                    {wifiList.map((wifi) => (
                      <div key={wifi.id} className="font-mono text-sm text-foreground/80">
                        {wifi.ssid}
                      </div>
                    ))}
                  </div>

                  {hasCommonPassword && commonPassword && (
                    <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                          {t("info.password")}
                        </span>
                        <code className="text-sm font-mono font-bold text-foreground bg-muted/50 px-2 py-0.5 rounded">
                          {commonPassword}
                        </code>
                      </div>
                      <CopyButton value={commonPassword} label={t("common.copy")} />
                    </div>
                  )}

                  {!hasCommonPassword && passwords.length > 0 && (
                    <div className="pt-3 border-t border-border/40 space-y-2">
                      {wifiList.map(
                        (wifi) =>
                          wifi.password && (
                            <div key={wifi.id} className="flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-muted-foreground block">
                                  {wifi.ssid}
                                </span>
                                <code className="text-sm font-mono font-bold text-foreground bg-muted/50 px-2 py-0.5 rounded">
                                  {wifi.password}
                                </code>
                              </div>
                              <CopyButton value={wifi.password} label={t("common.copy")} />
                            </div>
                          )
                      )}
                    </div>
                  )}

                  {passwords.length === 0 && (
                    <div className="pt-3 border-t border-border/40 text-sm text-muted-foreground">
                      {t("info.noPassword")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </m.section>
      )}

      {/* Mailbox & Address Section */}
      {(mailboxCodes.length > 0 || addresses.length > 0) && (
        <m.section variants={staggerItem}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mailbox Codes */}
            {mailboxCodes.map((info) => (
              <div
                key={info.id}
                className="rounded-xl border border-border/60 bg-card p-4 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <Mailbox size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {info.title || t("info.mailbox")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground font-mono">
                    {info.content}
                  </span>
                  <CopyButton value={info.content} label={t("common.copy")} />
                </div>
                {info.notes && (
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40">
                    {info.notes}
                  </p>
                )}
              </div>
            ))}

            {/* Addresses */}
            {addresses.map((info) => (
              <div
                key={info.id}
                className="rounded-xl border border-border/60 bg-card p-4 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <MapPin size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {info.title || t("info.address")}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {info.content}
                  </p>
                  <CopyButton value={info.content} label={t("common.copy")} className="-mt-1" />
                </div>
              </div>
            ))}
          </div>
        </m.section>
      )}
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
// Tab 3: Building Guide (Notes + Common Info)
// =============================================================================

interface BuildingGuideTabProps {
  sharedInfos: SharedInfo[];
}

function BuildingGuideTab({ sharedInfos }: BuildingGuideTabProps) {
  const t = useI18n();

  const wifiNote = useMemo(
    () => sharedInfos.find((info) => info.info_key === "wifi_note") ?? null,
    [sharedInfos]
  );

  // Floor-specific info (mailbox, address) is shown in QuickAccessTab, so filter to floor === null
  const commonInfos = useMemo(
    () =>
      sharedInfos.filter(
        (info) =>
          info.floor === null &&
          !info.info_key.startsWith("mailbox_code") &&
          !info.info_key.startsWith("address") &&
          info.info_key !== "wifi_note"
      ),
    [sharedInfos]
  );

  if (!wifiNote && commonInfos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm">{t("common.noData")}</p>
      </div>
    );
  }

  return (
    <m.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* WiFi Tips (highlighted) */}
      {wifiNote && (
        <m.div
          variants={staggerItem}
          className="p-4 sm:p-5 rounded-xl border border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/50"
        >
          <div className="flex gap-4">
            <div className="text-blue-600 dark:text-blue-400 mt-1">
              <Zap size={20} />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                {wifiNote.title}
              </h4>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {wifiNote.content}
              </p>
              {wifiNote.notes && (
                <div className="flex items-start gap-2 mt-2 text-xs text-blue-600/80 dark:text-blue-300/80">
                  <Info size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{wifiNote.notes}</span>
                </div>
              )}
            </div>
          </div>
        </m.div>
      )}

      {/* Common Information Cards */}
      {commonInfos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commonInfos.map((info) => (
            <m.div
              key={info.id}
              variants={staggerItem}
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
            </m.div>
          ))}
        </div>
      )}
    </m.div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function InfoPageContent({
  wifiInfos,
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
        <QuickAccessTab wifiInfos={wifiInfos} sharedInfos={sharedInfos} />
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
