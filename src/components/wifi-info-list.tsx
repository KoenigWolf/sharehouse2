"use client";

import { useState, useCallback, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { WifiInfoForm } from "@/components/wifi-info-form";
import { deleteWifiInfo } from "@/lib/wifi/actions";
import { ICON_SIZE, ICON_STROKE } from "@/lib/constants/icons";
import type { WifiInfo } from "@/domain/wifi";

interface WifiInfoListProps {
  wifiInfos: WifiInfo[];
  isAdmin: boolean;
}

/**
 * WiFi情報一覧コンポーネント
 *
 * 階ごとにタブで切り替えてWiFi情報を表示する。
 * パスワードはデフォルトでマスクされ、目アイコンで切り替え可能。
 * 管理者にはCRUD操作（追加・編集・削除）のUIを表示する。
 */
export function WifiInfoList({ wifiInfos, isAdmin }: WifiInfoListProps) {
  const t = useI18n();
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set()
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const floors = useMemo(() => {
    const floorSet = new Set<number>();
    wifiInfos.forEach((wifi) => {
      if (wifi.floor !== null) {
        floorSet.add(wifi.floor);
      }
    });
    return Array.from(floorSet).sort((a, b) => a - b);
  }, [wifiInfos]);

  const [activeFloor, setActiveFloor] = useState<number | null>(
    floors.length > 0 ? floors[0] : null
  );

  const filteredWifiInfos = useMemo(() => {
    if (activeFloor === null) {
      return wifiInfos;
    }
    return wifiInfos.filter((wifi) => wifi.floor === activeFloor);
  }, [wifiInfos, activeFloor]);

  const togglePassword = useCallback((id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(t("wifi.confirmDelete"))) return;

      setError("");
      const result = await deleteWifiInfo(id);
      if ("error" in result) {
        setError(result.error);
      }
    },
    [t]
  );

  const handleSaved = useCallback(() => {
    setShowAddForm(false);
    setEditingId(null);
  }, []);

  if (wifiInfos.length === 0 && !isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">{t("wifi.noInfo")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="py-3 px-4 border-l-2 border-error-border bg-error-bg text-sm text-error">
          {error}
        </div>
      )}

      {floors.length > 1 && (
        <div className="flex gap-2 mb-4">
          {floors.map((floor) => (
            <Button
              key={floor}
              type="button"
              variant={activeFloor === floor ? "default" : "outline"}
              onClick={() => setActiveFloor(floor)}
            >
              {floor}F
            </Button>
          ))}
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {filteredWifiInfos.map((wifi, index) => (
          <m.div
            key={wifi.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            {editingId === wifi.id ? (
              <WifiInfoForm
                initialData={wifi}
                onSave={handleSaved}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div>
                <h3 className="text-sm text-foreground font-medium tracking-wide mb-3">
                  {wifi.area_name}
                </h3>

                <dl className="space-y-2">
                  <div className="flex items-center justify-between">
                    <dt className="text-[10px] text-muted-foreground tracking-wide">
                      SSID
                    </dt>
                    <dd className="text-sm text-foreground font-mono">
                      {wifi.ssid}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between">
                    <dt className="text-[10px] text-muted-foreground tracking-wide">
                      {t("wifi.password")}
                    </dt>
                    <dd className="flex items-center gap-2">
                      <span className="text-sm text-foreground font-mono">
                        {visiblePasswords.has(wifi.id)
                          ? wifi.password
                          : "\u2022".repeat(8)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => togglePassword(wifi.id)}
                        aria-label={
                          visiblePasswords.has(wifi.id)
                            ? t("wifi.hidePassword")
                            : t("wifi.showPassword")
                        }
                      >
                        {visiblePasswords.has(wifi.id) ? (
                          <EyeOff size={ICON_SIZE.md} strokeWidth={ICON_STROKE.thin} />
                        ) : (
                          <Eye size={ICON_SIZE.md} strokeWidth={ICON_STROKE.thin} />
                        )}
                      </Button>
                    </dd>
                  </div>
                </dl>

                {isAdmin && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(wifi.id)}
                    >
                      {t("common.edit")}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(wifi.id)}
                    >
                      {t("common.delete")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </m.div>
        ))}
      </AnimatePresence>

      {isAdmin && (
        <div>
          {showAddForm ? (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <WifiInfoForm
                onSave={handleSaved}
                onCancel={() => setShowAddForm(false)}
              />
            </m.div>
          ) : (
            <Button
              type="button"
              variant="dashed"
              onClick={() => setShowAddForm(true)}
              className="w-full"
            >
              + {t("wifi.addNew")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

