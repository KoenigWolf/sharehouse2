"use client";

import { useState, useEffect } from "react";
import { Clock, ChevronDown } from "lucide-react";
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

const BASE_INPUT_CLASS =
  "w-full h-12 px-4 bg-secondary/50 border border-border rounded-2xl text-foreground text-[15px] font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 focus:bg-card transition-all duration-300";

interface CustomInputProps {
  value: string;
  onChange: (value: string) => void;
  onBackToSelect: () => void;
  placeholder?: string;
  className?: string;
}

function CustomTimeInput({
  value,
  onChange,
  onBackToSelect,
  placeholder,
  className,
}: CustomInputProps) {
  const t = useI18n();

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Clock
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? t("events.timePlaceholder")}
          className={`${BASE_INPUT_CLASS} ${className ?? ""} pl-11`}
        />
      </div>
      <button
        type="button"
        onClick={onBackToSelect}
        className="h-12 px-4 rounded-2xl bg-secondary/50 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-sm font-medium whitespace-nowrap"
      >
        {t("events.timeSelectMode")}
      </button>
    </div>
  );
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onCustomSelect: () => void;
  className?: string;
}

function TimeSelectDropdown({
  value,
  onChange,
  onCustomSelect,
  className,
}: SelectDropdownProps) {
  const t = useI18n();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "__custom__") {
      onCustomSelect();
    } else {
      onChange(selected);
    }
  };

  return (
    <div className="relative">
      <Clock
        size={16}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none z-10"
      />
      <select
        value={value}
        onChange={handleChange}
        className={`${BASE_INPUT_CLASS} ${className ?? ""} pl-11 appearance-none cursor-pointer`}
      >
        <option value="">{t("events.timeNotSet")}</option>
        {HOURLY_OPTIONS.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
        <option value="__custom__">{t("events.timeCustom")}</option>
      </select>
      <ChevronDown
        size={16}
        className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
      />
    </div>
  );
}

export function TimeSelect({
  value,
  onChange,
  placeholder,
  className,
}: TimeSelectProps) {
  const [isCustom, setIsCustom] = useState(() => {
    return value !== "" && !isHourlyTime(value);
  });

  useEffect(() => {
    if (value === "" || isHourlyTime(value)) {
      setTimeout(() => setIsCustom(false), 0);
    } else {
      setTimeout(() => setIsCustom(true), 0);
    }
  }, [value]);

  const handleBackToSelect = () => {
    setIsCustom(false);
    onChange("");
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
    onChange("");
  };

  if (isCustom) {
    return (
      <CustomTimeInput
        value={value}
        onChange={onChange}
        onBackToSelect={handleBackToSelect}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <TimeSelectDropdown
      value={value}
      onChange={onChange}
      onCustomSelect={handleCustomSelect}
      className={className}
    />
  );
}
