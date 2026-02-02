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
    <div className="bg-white border border-[#e4e4e7] rounded-lg p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-md bg-[#f4f4f5] flex items-center justify-center flex-shrink-0 text-[#71717a]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-[#a1a1aa] tracking-wide uppercase">{label}</p>
        <p className="text-sm text-[#18181b] font-medium font-mono truncate">{value}</p>
        {subtext && <p className="text-[10px] text-[#a1a1aa] mt-0.5">{subtext}</p>}
      </div>
      {copyLabel && (
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={handleCopy}
          className="flex-shrink-0"
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
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[#a1a1aa]">{icon}</span>
      <h2 className="text-xs text-[#a1a1aa] tracking-wide uppercase">{title}</h2>
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
    <div className="bg-white border border-[#e4e4e7] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e4e4e7] bg-[#f4f4f5]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#a1a1aa] tracking-wide uppercase">
              {t("wifi.password")}
            </p>
            <p className="text-sm text-[#18181b] font-mono mt-0.5">
              {showPassword ? password : "••••••••••••"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t("wifi.hidePassword") : t("wifi.showPassword")}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleCopyPassword}
            >
              {copied ? "✓" : t("common.copy")}
            </Button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-[#e4e4e7]">
        {wifiInfos.map((wifi) => (
          <div key={wifi.id} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#a1a1aa] w-14">{wifi.area_name}</span>
              <span className="text-sm text-[#18181b] font-mono">{wifi.ssid}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 bg-[#f4f4f5] border-t border-[#e4e4e7]">
        <p className="text-[10px] text-[#a1a1aa]">
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
      <div>
        <h1 className="text-xl text-[#18181b] tracking-wide font-light">
          {t("info.title")}
        </h1>
        <p className="text-xs text-[#a1a1aa] mt-1">
          {t("info.subtitle")}
        </p>
      </div>

      <m.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
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
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <SectionHeader icon={<WifiIcon />} title="Wi-Fi" />
        <WifiCard wifiInfos={wifiInfos} />
      </m.section>

      <m.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
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
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <SectionHeader icon={<BuildingIcon />} title={t("info.tabBuilding")} />
          <div className="space-y-3">
            {addressInfo && (
              <div className="bg-white border border-[#e4e4e7] rounded-lg p-4">
                <p className="text-[10px] text-[#a1a1aa] tracking-wide uppercase mb-1">
                  {addressInfo.title}
                </p>
                <p className="text-sm text-[#18181b]">{addressInfo.content}</p>
                {addressInfo.notes && (
                  <p className="text-xs text-[#71717a] mt-2">{addressInfo.notes}</p>
                )}
              </div>
            )}
            {sharedInfos
              .filter((info) => info.info_key !== "mailbox_code" && info.info_key !== "address")
              .map((info) => (
                <div key={info.id} className="bg-white border border-[#e4e4e7] rounded-lg p-4">
                  <p className="text-[10px] text-[#a1a1aa] tracking-wide uppercase mb-1">
                    {info.title}
                  </p>
                  <p className="text-sm text-[#18181b]">{info.content}</p>
                  {info.notes && (
                    <p className="text-xs text-[#71717a] mt-2">{info.notes}</p>
                  )}
                </div>
              ))}
          </div>
        </m.section>
      )}
    </div>
  );
}
