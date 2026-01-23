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
    <div className="bg-white border border-[#e5e5e5] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f5f5f3] flex items-center justify-center">
            <span className="text-2xl">☕</span>
          </div>
          <div>
            <h3 className="text-[#1a1a1a] tracking-wide">ティータイム参加</h3>
            <p className="text-sm text-[#737373] mt-0.5">
              {isEnabled ? "参加中 - マッチングの対象です" : "参加していません"}
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

      {isEnabled && (
        <div className="mt-4 pt-4 border-t border-[#e5e5e5]">
          <p className="text-sm text-[#737373]">
            ランダムに他の住民とマッチングされます。
            マッチが成立したらお知らせします。
          </p>
        </div>
      )}
    </div>
  );
}
