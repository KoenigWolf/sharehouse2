"use client";

import { useState, useCallback, memo } from "react";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { GarbageScheduleView } from "@/components/garbage-schedule-view";
import { GarbageAdminPanel } from "@/components/garbage-admin-panel";
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
    <div className="premium-surface rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-xl hover:-translate-y-0.5 border-slate-50">
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400 border border-slate-100 shadow-inner">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-0.5">{label}</p>
        <p className="text-[15px] text-slate-900 font-bold font-mono tracking-tight truncate">{value}</p>
        {subtext && <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{subtext}</p>}
      </div>
      {copyLabel && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="flex-shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] h-9"
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
    <div className="flex items-center gap-2 mb-4 mt-2">
      <span className="text-slate-300">{icon}</span>
      <h2 className="text-[11px] font-bold tracking-widest uppercase text-slate-400">{title}</h2>
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
    <div className="premium-surface rounded-2xl overflow-hidden border-slate-50">
      <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
              {t("wifi.password")}
            </p>
            <p className="text-lg font-bold text-slate-900 font-mono tracking-tight mt-0.5">
              {showPassword ? password : "••••••••••••"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl w-10 h-10"
              aria-label={showPassword ? t("wifi.hidePassword") : t("wifi.showPassword")}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyPassword}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] h-10 px-4"
            >
              {copied ? "✓" : t("common.copy")}
            </Button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-50 bg-white">
        {wifiInfos.map((wifi) => (
          <div key={wifi.id} className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest w-16">{wifi.area_name}</span>
              <span className="text-[15px] text-slate-900 font-mono font-bold tracking-tight">{wifi.ssid}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 bg-slate-50/30 border-t border-slate-50">
        <p className="text-[11px] text-slate-400 font-medium italic italic">
          {t("info.wifiNote")}
        </p>
      </div>
    </div>
  );
});

WifiCard.displayName = "WifiCard";

function WifiIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function MailboxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
      <polyline points="15,9 18,9 18,11" />
      <path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2v0" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

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
        <h1 className="text-2xl font-light text-slate-900 tracking-wide">
          {t("info.title")}
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 font-medium">
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
              icon={<KeyIcon />}
              label={t("info.wifiPassword")}
              value={wifiPassword}
              copyLabel={t("common.copy")}
            />
          )}
          {mailboxInfo && (
            <QuickAccessCard
              icon={<MailboxIcon />}
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
        <SectionHeader icon={<WifiIcon />} title="Wi-Fi" />
        <WifiCard wifiInfos={wifiInfos} />
      </m.section>

      <m.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
      >
        <SectionHeader icon={<TrashIcon />} title={t("info.tabGarbage")} />
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
          <SectionHeader icon={<BuildingIcon />} title={t("info.tabBuilding")} />
          <div className="space-y-4">
            {addressInfo && (
              <div className="premium-surface rounded-2xl p-5 border-slate-50">
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">
                  {addressInfo.title}
                </p>
                <p className="text-[15px] font-bold text-slate-900 leading-snug">{addressInfo.content}</p>
                {addressInfo.notes && (
                  <p className="text-xs text-slate-500 mt-2 font-medium italic">{addressInfo.notes}</p>
                )}
              </div>
            )}
            {sharedInfos
              .filter((info) => info.info_key !== "mailbox_code" && info.info_key !== "address")
              .map((info) => (
                <div key={info.id} className="premium-surface rounded-2xl p-5 border-slate-50">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">
                    {info.title}
                  </p>
                  <p className="text-[15px] font-bold text-slate-900 leading-snug">{info.content}</p>
                  {info.notes && (
                    <p className="text-xs text-slate-500 mt-2 font-medium italic">{info.notes}</p>
                  )}
                </div>
              ))}
          </div>
        </m.section>
      )}
    </div>
  );
}
