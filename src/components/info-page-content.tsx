"use client";

import { useState, useCallback, memo } from "react";
import { m } from "framer-motion";
import {
  Wifi,
  Trash2,
  KeyRound,
  Mailbox,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { GarbageScheduleView } from "@/components/garbage-schedule-view";
import { GarbageAdminPanel } from "@/components/garbage-admin-panel";
import { ICON_SIZE, ICON_STROKE, ICON_GAP } from "@/lib/constants/icons";
import type { WifiInfo } from "@/domain/wifi";
import type { GarbageSchedule, GarbageDutyWithProfile } from "@/domain/garbage";
import type { SharedInfo } from "@/domain/shared-info";

interface InfoPageContentProps {
  wifiInfos: WifiInfo[];
  schedule: GarbageSchedule[];
  duties: GarbageDutyWithProfile[];
  sharedInfos: SharedInfo[];
  isAdmin: boolean;
  currentUserId: string;
}

interface QuickAccessCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  onCopy?: () => void;
  copyLabel?: string;
}

const QuickAccessCard = memo(function QuickAccessCard({
  icon,
  label,
  value,
  subtext,
  onCopy,
  copyLabel,
}: QuickAccessCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  }, [value, onCopy]);

  return (
    <div className="premium-surface rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-xl hover:-translate-y-0.5 border-border/50">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground border border-border shadow-inner">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-0.5">{label}</p>
        <p className="text-[15px] text-foreground font-bold font-mono tracking-tight truncate">{value}</p>
        {subtext && <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{subtext}</p>}
      </div>
      {copyLabel && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="flex-shrink-0 rounded-xl bg-secondary hover:bg-secondary text-foreground/80 font-bold text-[11px] h-9"
        >
          {copied ? "✓" : copyLabel}
        </Button>
      )}
    </div>
  );
});

QuickAccessCard.displayName = "QuickAccessCard";

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

const SectionHeader = memo(function SectionHeader({ icon, title }: SectionHeaderProps) {
  return (
    <div className={`flex items-center ${ICON_GAP.md} mb-4 mt-2`}>
      <span className="text-muted-foreground/70">{icon}</span>
      <h2 className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">{title}</h2>
    </div>
  );
});

SectionHeader.displayName = "SectionHeader";

interface WifiCardProps {
  wifiInfos: WifiInfo[];
}

const WifiCard = memo(function WifiCard({ wifiInfos }: WifiCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const t = useI18n();

  const password = wifiInfos[0]?.password || "";

  const handleCopyPassword = useCallback(() => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [password]);

  if (wifiInfos.length === 0) return null;

  return (
    <div className="premium-surface rounded-2xl overflow-hidden border-border/50">
      <div className="px-5 py-4 border-b border-border/50 bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              {t("wifi.password")}
            </p>
            <p className="text-lg font-bold text-foreground font-mono tracking-tight mt-0.5">
              {showPassword ? password : "••••••••••••"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl w-10 h-10"
              aria-label={showPassword ? t("wifi.hidePassword") : t("wifi.showPassword")}
            >
              {showPassword ? (
                <EyeOff size={ICON_SIZE.md} strokeWidth={ICON_STROKE.thin} />
              ) : (
                <Eye size={ICON_SIZE.md} strokeWidth={ICON_STROKE.thin} />
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyPassword}
              className="rounded-xl bg-secondary hover:bg-secondary text-foreground/80 font-bold text-[11px] h-10 px-4"
            >
              {copied ? "✓" : t("common.copy")}
            </Button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border/50 bg-card">
        {wifiInfos.map((wifi) => (
          <div key={wifi.id} className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest w-16">{wifi.area_name}</span>
              <span className="text-[15px] text-foreground font-mono font-bold tracking-tight">{wifi.ssid}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 bg-muted/30 border-t border-border/50">
        <p className="text-[11px] text-muted-foreground font-medium italic">
          {t("info.wifiNote")}
        </p>
      </div>
    </div>
  );
});

WifiCard.displayName = "WifiCard";


export function InfoPageContent({
  wifiInfos,
  schedule,
  duties,
  sharedInfos,
  isAdmin,
  currentUserId,
}: InfoPageContentProps) {
  const t = useI18n();

  const mailboxInfo = sharedInfos.find((info) => info.info_key === "mailbox_code");
  const addressInfo = sharedInfos.find((info) => info.info_key === "address");
  const wifiPassword = wifiInfos[0]?.password || "";

  return (
    <div className="space-y-8">
      <div className="mb-2">
        <h1 className="heading-page">
          {t("info.title")}
        </h1>
        <p className="subtitle mt-2">
          {t("info.subtitle")}
        </p>
      </div>

      <m.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {wifiPassword && (
            <QuickAccessCard
              icon={<KeyRound size={ICON_SIZE.md} strokeWidth={ICON_STROKE.thin} />}
              label={t("info.wifiPassword")}
              value={wifiPassword}
              copyLabel={t("common.copy")}
            />
          )}
          {mailboxInfo && (
            <QuickAccessCard
              icon={<Mailbox size={ICON_SIZE.md} strokeWidth={ICON_STROKE.thin} />}
              label={mailboxInfo.title}
              value={mailboxInfo.content}
              subtext={mailboxInfo.notes || undefined}
            />
          )}
        </div>
      </m.section>

      <m.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
      >
        <SectionHeader icon={<Wifi size={ICON_SIZE.md} strokeWidth={ICON_STROKE.thin} />} title={t("info.tabWifi")} />
        <WifiCard wifiInfos={wifiInfos} />
      </m.section>

      <m.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
      >
        <SectionHeader icon={<Trash2 size={ICON_SIZE.md} strokeWidth={ICON_STROKE.thin} />} title={t("info.tabGarbage")} />
        <GarbageScheduleView
          schedule={schedule}
          duties={duties}
          currentUserId={currentUserId}
        />
        {isAdmin && <GarbageAdminPanel schedule={schedule} />}
      </m.section>

      {(addressInfo || sharedInfos.filter((i) => i.info_key !== "mailbox_code" && i.info_key !== "address").length > 0) && (
        <m.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
        >
          <SectionHeader icon={<Building2 size={ICON_SIZE.md} strokeWidth={ICON_STROKE.thin} />} title={t("info.tabBuilding")} />
          <div className="space-y-4">
            {addressInfo && (
              <div className="premium-surface rounded-2xl p-5 border-border/50">
                <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">
                  {addressInfo.title}
                </p>
                <p className="text-[15px] font-bold text-foreground leading-snug">{addressInfo.content}</p>
                {addressInfo.notes && (
                  <p className="text-xs text-muted-foreground mt-2 font-medium italic">{addressInfo.notes}</p>
                )}
              </div>
            )}
            {sharedInfos
              .filter((info) => info.info_key !== "mailbox_code" && info.info_key !== "address")
              .map((info) => (
                <div key={info.id} className="premium-surface rounded-2xl p-5 border-border/50">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">
                    {info.title}
                  </p>
                  <p className="text-[15px] font-bold text-foreground leading-snug">{info.content}</p>
                  {info.notes && (
                    <p className="text-xs text-muted-foreground mt-2 font-medium italic">{info.notes}</p>
                  )}
                </div>
              ))}
          </div>
        </m.section>
      )}
    </div>
  );
}
