"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Wifi,
  Trash2,
  KeyRound,
  Mailbox,
  Building2,
  Copy,
  Check,
  MapPin,
  Signal,
  Info,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { GarbageScheduleView } from "@/components/garbage-schedule-view";
import { GarbageAdminPanel } from "@/components/garbage-admin-panel";
import type { WifiInfo } from "@/domain/wifi";
import type { GarbageSchedule, GarbageDutyWithProfile } from "@/domain/garbage";
import type { SharedInfo } from "@/domain/shared-info";
import { cn } from "@/lib/utils";

interface InfoPageContentProps {
  wifiInfos: WifiInfo[];
  schedule: GarbageSchedule[];
  duties: GarbageDutyWithProfile[];
  sharedInfos: SharedInfo[];
  isAdmin: boolean;
  currentUserId: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

interface FloorData {
  floor: number;
  wifiInfos: WifiInfo[];
  mailboxInfo: SharedInfo | null;
  addressInfo: SharedInfo | null;
}

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
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        "w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-all duration-200",
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

const FloorSection = memo(function FloorSection({ floorData }: { floorData: FloorData }) {
  const t = useI18n();
  const password = floorData.wifiInfos[0]?.password ?? "";
  const isShared = floorData.floor === 0;

  return (
    <m.div variants={itemVariants} className="group">
      <div className="flex items-baseline gap-4 mb-4 border-b border-border/50 pb-2">
        <h3 className="text-xl font-semibold tracking-tight text-foreground font-sans">
          {isShared ? "田中ビル" : `${floorData.floor}F`}
        </h3>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {isShared ? "共用設備" : "フロア情報"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Wi-Fi Card */}
        {floorData.wifiInfos.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-card p-5 hover:border-border transition-colors">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Wifi size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Wi-Fi</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                {floorData.wifiInfos.map((wifi) => (
                  <div key={wifi.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-foreground/80">{wifi.ssid}</span>
                    <Signal size={14} className="text-emerald-500" />
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">Password</span>
                  {password ? (
                    <code className="text-sm font-mono font-bold text-foreground bg-muted/50 px-2 py-0.5 rounded">
                      {password}
                    </code>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      No Password
                    </span>
                  )}
                </div>
                {password && <CopyButton value={password} label={t("common.copy")} />}
              </div>
            </div>
          </div>
        )}

        {/* Mailbox Card */}
        {floorData.mailboxInfo && (
          <div className="rounded-xl border border-border/60 bg-card p-5 hover:border-border transition-colors">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Mailbox size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Mailbox</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-foreground font-mono">
                {floorData.mailboxInfo.content}
              </span>
              <CopyButton value={floorData.mailboxInfo.content} label="Copy Mailbox Code" />
            </div>
            {floorData.mailboxInfo.notes && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40">
                {floorData.mailboxInfo.notes}
              </p>
            )}
          </div>
        )}

        {/* Address Card */}
        {floorData.addressInfo && (
          <div className="rounded-xl border border-border/60 bg-card p-5 hover:border-border transition-colors md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <MapPin size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Address</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {floorData.addressInfo.content}
              </p>
              <CopyButton value={floorData.addressInfo.content} label="Copy Address" className="-mt-1" />
            </div>
          </div>
        )}
      </div>
    </m.div>
  );
});
FloorSection.displayName = "FloorSection";

const CommonInfoCard = memo(function CommonInfoCard({ info }: { info: SharedInfo }) {
  return (
    <m.div
      variants={itemVariants}
      className="p-5 rounded-xl border border-border/60 bg-card hover:border-border transition-colors"
    >
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        <Info size={18} />
        <h4 className="text-xs font-bold uppercase tracking-wider">
          {info.title}
        </h4>
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
  );
});
CommonInfoCard.displayName = "CommonInfoCard";


export function InfoPageContent({
  wifiInfos,
  schedule,
  duties,
  sharedInfos,
  isAdmin,
  currentUserId,
}: InfoPageContentProps) {
  const t = useI18n();

  const floorDataList = useMemo(() => {
    const floorSet = new Set<number>();
    wifiInfos.forEach((w) => w.floor !== null && floorSet.add(w.floor));
    sharedInfos.forEach((i) => i.floor !== null && floorSet.add(i.floor));

    const floors = Array.from(floorSet).sort((a, b) => {
      if (a === 0) return 1;
      if (b === 0) return -1;
      return a - b;
    });

    return floors.map((floor): FloorData => {
      const floorWifi = wifiInfos
        .filter((w) => w.floor === floor)
        .sort((a, b) => a.display_order - b.display_order);

      const mailboxInfo =
        sharedInfos.find(
          (info) => info.floor === floor && info.info_key.startsWith("mailbox_code")
        ) ?? null;

      const addressInfo =
        sharedInfos.find(
          (info) => info.floor === floor && info.info_key.startsWith("address")
        ) ?? null;

      return { floor, wifiInfos: floorWifi, mailboxInfo, addressInfo };
    });
  }, [wifiInfos, sharedInfos]);

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

  const wifiNote = useMemo(
    () => sharedInfos.find((info) => info.info_key === "wifi_note") ?? null,
    [sharedInfos]
  );

  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 max-w-5xl mx-auto"
    >
      {/* Header */}
      <m.div variants={itemVariants} className="pb-6 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-2">
          {t("info.title")}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t("info.subtitle")}
        </p>
      </m.div>

      {/* Floors Section */}
      {floorDataList.length > 0 && (
        <section className="space-y-10">
          <div className="flex items-center gap-2 text-muted-foreground mb-6">
            <KeyRound size={20} />
            <h2 className="text-sm font-bold uppercase tracking-widest">
              Floor Guide
            </h2>
          </div>

          <div className="space-y-12">
            {floorDataList.map((floorData) => (
              <FloorSection key={floorData.floor} floorData={floorData} />
            ))}
          </div>
        </section>
      )}

      {/* Garbage Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground border-b border-border/50 pb-2 mb-6">
          <Trash2 size={20} />
          <h2 className="text-sm font-bold uppercase tracking-widest">
            Garbage & Duties
          </h2>
        </div>

        <m.div variants={itemVariants}>
          <GarbageScheduleView
            schedule={schedule}
            duties={duties}
            currentUserId={currentUserId}
          />
          {isAdmin && (
            <div className="mt-8 pt-8 border-t border-border">
              <GarbageAdminPanel schedule={schedule} />
            </div>
          )}
        </m.div>
      </section>

      {/* Common Layout */}
      {(commonInfos.length > 0 || wifiNote) && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-muted-foreground border-b border-border/50 pb-2 mb-6">
            <Building2 size={20} />
            <h2 className="text-sm font-bold uppercase tracking-widest">
              General Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wi-Fi Note */}
            {wifiNote && (
              <m.div
                variants={itemVariants}
                className="md:col-span-2 p-5 rounded-xl border border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/50"
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

            {/* Other Common Infos */}
            {commonInfos.map((info) => (
              <CommonInfoCard key={info.id} info={info} />
            ))}
          </div>
        </section>
      )}
    </m.div>
  );
}
