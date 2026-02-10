"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const HOURLY_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = String(i).padStart(2, "0");
  return `${hour}:00`;
});

function isHourlyTime(time: string): boolean {
  return HOURLY_OPTIONS.includes(time);
}

export function TimeSelect({ value, onChange, placeholder, className }: TimeSelectProps) {
  const t = useI18n();
  const [isCustom, setIsCustom] = useState(() => {
    return value !== "" && !isHourlyTime(value);
  });

  useEffect(() => {
    if (value !== "" && !isHourlyTime(value)) {
      // Defer setState to avoid cascading renders warning
      setTimeout(() => setIsCustom(true), 0);
    }
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "__custom__") {
      setIsCustom(true);
      onChange("");
    } else {
      setIsCustom(false);
      onChange(selected);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBackToSelect = () => {
    setIsCustom(false);
    onChange("");
  };

  const inputClassName = `w-full h-12 px-4 bg-secondary/50 border border-border rounded-2xl text-foreground text-[15px] font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 focus:bg-card transition-all duration-300 ${className ?? ""}`;

  if (isCustom) {
    return (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            value={value}
            onChange={handleCustomChange}
            placeholder={placeholder ?? t("events.timePlaceholder")}
            className={`${inputClassName} pl-11`}
          />
        </div>
        <button
          type="button"
          onClick={handleBackToSelect}
          className="h-12 px-4 rounded-2xl bg-secondary/50 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-sm font-medium whitespace-nowrap"
        >
          {t("events.timeSelectMode")}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none z-10" />
      <select
        value={value}
        onChange={handleSelectChange}
        className={`${inputClassName} pl-11 appearance-none cursor-pointer`}
      >
        <option value="">{t("events.timeNotSet")}</option>
        {HOURLY_OPTIONS.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
        <option value="__custom__">{t("events.timeCustom")}</option>
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-4 h-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
