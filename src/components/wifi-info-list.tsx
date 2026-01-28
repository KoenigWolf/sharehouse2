"use client";

import { useState, useCallback, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useI18n } from "@/hooks/use-i18n";
import { WifiInfoForm } from "@/components/wifi-info-form";
import { deleteWifiInfo } from "@/lib/wifi/actions";
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

  // 階のリストを取得（ソート済み）
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

  // 選択中の階のWi-Fi情報をフィルタ
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
        <p className="text-sm text-[#737373]">{t("wifi.noInfo")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="py-3 px-4 border-l-2 border-[#c9a0a0] bg-[#faf8f8] text-sm text-[#8b6b6b]">
          {error}
        </div>
      )}

      {/* 階タブ */}
      {floors.length > 1 && (
        <div className="flex gap-2 mb-4">
          {floors.map((floor) => (
            <button
              key={floor}
              type="button"
              onClick={() => setActiveFloor(floor)}
              className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                activeFloor === floor
                  ? "bg-[#1a1a1a] text-white"
                  : "bg-white border border-[#e5e5e5] text-[#737373] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
              }`}
            >
              {floor}F
            </button>
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
            className="bg-white border border-[#e5e5e5] p-4"
          >
            {editingId === wifi.id ? (
              <WifiInfoForm
                initialData={wifi}
                onSave={handleSaved}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div>
                {/* エリア名 */}
                <h3 className="text-sm text-[#1a1a1a] font-medium tracking-wide mb-3">
                  {wifi.area_name}
                </h3>

                {/* SSID */}
                <dl className="space-y-2">
                  <div className="flex items-center justify-between">
                    <dt className="text-[10px] text-[#a3a3a3] tracking-wide">
                      SSID
                    </dt>
                    <dd className="text-sm text-[#1a1a1a] font-mono">
                      {wifi.ssid}
                    </dd>
                  </div>

                  {/* パスワード */}
                  <div className="flex items-center justify-between">
                    <dt className="text-[10px] text-[#a3a3a3] tracking-wide">
                      {t("wifi.password")}
                    </dt>
                    <dd className="flex items-center gap-2">
                      <span className="text-sm text-[#1a1a1a] font-mono">
                        {visiblePasswords.has(wifi.id)
                          ? wifi.password
                          : "\u2022".repeat(8)}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePassword(wifi.id)}
                        className="p-1 text-[#a3a3a3] hover:text-[#737373] transition-colors"
                        aria-label={
                          visiblePasswords.has(wifi.id)
                            ? t("wifi.hidePassword")
                            : t("wifi.showPassword")
                        }
                      >
                        {visiblePasswords.has(wifi.id) ? (
                          <EyeOffIcon />
                        ) : (
                          <EyeIcon />
                        )}
                      </button>
                    </dd>
                  </div>
                </dl>

                {/* 管理者アクション */}
                {isAdmin && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#e5e5e5]">
                    <button
                      type="button"
                      onClick={() => setEditingId(wifi.id)}
                      className="px-3 py-1.5 text-xs text-[#737373] border border-[#e5e5e5] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(wifi.id)}
                      className="px-3 py-1.5 text-xs text-[#8b6b6b] border border-[#c9a0a0] hover:border-[#8b6b6b] transition-colors"
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </m.div>
        ))}
      </AnimatePresence>

      {/* 新規追加（管理者のみ） */}
      {isAdmin && (
        <div>
          {showAddForm ? (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#e5e5e5] p-4"
            >
              <WifiInfoForm
                onSave={handleSaved}
                onCancel={() => setShowAddForm(false)}
              />
            </m.div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 border border-dashed border-[#e5e5e5] text-sm text-[#a3a3a3] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
            >
              + {t("wifi.addNew")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
