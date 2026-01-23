"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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

    if ("error" in result) {
      setIsEnabled(!checked);
    }

    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-[#e5e5e5] p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#1a1a1a]">ランダムマッチングに参加</p>
          <p className="text-[10px] text-[#a3a3a3] mt-1">
            {isEnabled
              ? "毎週ランダムに住民とマッチングされます"
              : "マッチング対象外です"}
          </p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isLoading}
          className="data-[state=checked]:bg-[#1a1a1a]"
        />
      </div>
    </motion.div>
  );
}
