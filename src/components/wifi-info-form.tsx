"use client";

import { useState, useCallback } from "react";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { createWifiInfo, updateWifiInfo } from "@/lib/wifi/actions";
import type { WifiInfo, WifiInfoInput } from "@/domain/wifi";

interface WifiInfoFormProps {
  initialData?: WifiInfo;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * WiFi情報フォームコンポーネント
 *
 * 新規作成・編集の両方に対応する。
 * initialDataが渡された場合は編集モードで動作し、updateWifiInfoを呼ぶ。
 * それ以外はcreateWifiInfoを呼ぶ。
 *
 * @param props.initialData - 編集時の初期データ
 * @param props.onSave - 保存成功時のコールバック
 * @param props.onCancel - キャンセル時のコールバック
 */
export function WifiInfoForm({ initialData, onSave, onCancel }: WifiInfoFormProps) {
  const t = useI18n();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState<WifiInfoInput>({
    area_name: initialData?.area_name ?? "",
    ssid: initialData?.ssid ?? "",
    password: initialData?.password ?? "",
    display_order: initialData?.display_order ?? 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = useCallback(
    (field: keyof WifiInfoInput, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError("");

      try {
        const result = isEditing && initialData
          ? await updateWifiInfo(initialData.id, formData)
          : await createWifiInfo(formData);

        if ("error" in result) {
          setError(result.error);
        } else {
          onSave();
        }
      } catch {
        setError(t("errors.serverError"));
      } finally {
        setIsLoading(false);
      }
    },
    [formData, isEditing, initialData, onSave, t]
  );

  return (
    <m.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {error && (
        <div className="py-2 px-3 border border-error-border bg-error-bg text-xs text-error">
          {error}
        </div>
      )}

      <div>
        <label className="block text-[10px] text-muted-foreground tracking-wide mb-1">
          {t("wifi.areaName")}
        </label>
        <input
          type="text"
          value={formData.area_name}
          onChange={(e) => handleChange("area_name", e.target.value)}
          required
          className="w-full h-10 px-3 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground transition-colors"
          placeholder={t("wifi.areaNamePlaceholder")}
        />
      </div>

      <div>
        <label className="block text-[10px] text-muted-foreground tracking-wide mb-1">
          SSID
        </label>
        <input
          type="text"
          value={formData.ssid}
          onChange={(e) => handleChange("ssid", e.target.value)}
          required
          className="w-full h-10 px-3 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground transition-colors"
          placeholder={t("wifi.ssidPlaceholder")}
        />
      </div>

      <div>
        <label className="block text-[10px] text-muted-foreground tracking-wide mb-1">
          {t("wifi.password")}
        </label>
        <input
          type="text"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          required
          className="w-full h-10 px-3 bg-card border border-border rounded-md text-sm text-foreground font-mono placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground transition-colors"
          placeholder={t("wifi.passwordPlaceholder")}
        />
      </div>

      <div>
        <label className="block text-[10px] text-muted-foreground tracking-wide mb-1">
          {t("wifi.displayOrder")}
        </label>
        <input
          type="number"
          value={formData.display_order}
          onChange={(e) =>
            handleChange("display_order", parseInt(e.target.value, 10) || 0)
          }
          min={0}
          className="w-24 h-10 px-3 bg-card border border-border rounded-md text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading
            ? t("common.saving")
            : isEditing
              ? t("common.save")
              : t("wifi.add")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </m.form>
  );
}
