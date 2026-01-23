"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { updateTeaTimeSetting } from "@/lib/tea-time/actions";

interface TeaTimeToggleProps {
  initialEnabled: boolean;
}

export function TeaTimeToggle({ initialEnabled }: TeaTimeToggleProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    setIsEnabled(checked);

    const result = await updateTeaTimeSetting(checked);

    if (result.error) {
      setIsEnabled(!checked);
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-white border border-[#e5e5e5] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">☕</span>
          <div>
            <p className="text-sm text-[#1a1a1a]">参加する</p>
            <p className="text-[11px] text-[#a3a3a3]">
              {isEnabled ? "マッチング対象です" : "参加していません"}
            </p>
          </div>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isLoading}
          className="data-[state=checked]:bg-[#b94a48]"
        />
      </div>
    </div>
  );
}
