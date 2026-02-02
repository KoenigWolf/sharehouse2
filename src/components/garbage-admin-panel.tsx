"use client";

import { useState, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useI18n, useLocale } from "@/hooks/use-i18n";
import {
  createGarbageScheduleEntry,
  updateGarbageScheduleEntry,
  deleteGarbageScheduleEntry,
  generateDutyRotation,
} from "@/lib/garbage/actions";
import { DAY_NAMES_JA, DAY_NAMES_EN } from "@/domain/garbage";
import type { GarbageSchedule, GarbageScheduleInput } from "@/domain/garbage";

interface GarbageAdminPanelProps {
  schedule: GarbageSchedule[];
}

/**
 * ゴミ出し管理パネル（管理者専用）
 *
 * スケジュールのCRUD操作と当番ローテーション自動生成機能を提供する。
 * スケジュールエントリの追加・編集・削除と、
 * 開始日・週数を指定してのローテーション生成が可能。
 *
 * @param props.schedule - 現在のゴミ出しスケジュール
 */
export function GarbageAdminPanel({ schedule }: GarbageAdminPanelProps) {
  const t = useI18n();
  const locale = useLocale();
  const dayNames = locale === "ja" ? DAY_NAMES_JA : DAY_NAMES_EN;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ローテーション生成フォーム
  const [rotationStartDate, setRotationStartDate] = useState("");
  const [rotationWeeks, setRotationWeeks] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(t("garbage.confirmDelete"))) return;

      setError("");
      setSuccess("");
      const result = await deleteGarbageScheduleEntry(id);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(t("garbage.deleteSuccess"));
      }
    },
    [t]
  );

  const handleGenerate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!rotationStartDate) return;

      setIsGenerating(true);
      setError("");
      setSuccess("");

      const result = await generateDutyRotation(rotationStartDate, rotationWeeks);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(
          t("garbage.generateSuccess", { count: result.count })
        );
      }
      setIsGenerating(false);
    },
    [rotationStartDate, rotationWeeks, t]
  );

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="border-t border-[#e4e4e7] pt-5">
        <h2 className="text-sm text-[#18181b] font-medium tracking-wide mb-4">
          {t("garbage.adminPanel")}
        </h2>

        {error && (
          <div className="mb-4 py-2 px-3 border border-red-200 bg-red-50 text-xs text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 py-2 px-3 border border-green-200 bg-green-50 text-xs text-green-600">
            {success}
          </div>
        )}

        <section className="mb-6">
          <h3 className="text-xs text-[#a1a1aa] tracking-wide mb-3">
            {t("garbage.scheduleManagement")}
          </h3>

          <AnimatePresence mode="popLayout">
            {schedule.map((entry, index) => (
              <m.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, delay: index * 0.03 }}
                className="flex items-center justify-between px-4 py-3 bg-white border border-[#e4e4e7] rounded-lg mb-2"
              >
                {editingId === entry.id ? (
                  <ScheduleEntryForm
                    initialData={entry}
                    dayNames={dayNames}
                    onSave={() => {
                      setEditingId(null);
                      setSuccess(t("garbage.saveSuccess"));
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-medium w-8 ${
                          entry.day_of_week === 0
                            ? "text-red-400"
                            : entry.day_of_week === 6
                              ? "text-blue-400"
                              : "text-[#18181b]"
                        }`}
                      >
                        {dayNames[entry.day_of_week]}
                      </span>
                      <span className="text-sm text-[#71717a]">
                        {entry.garbage_type}
                      </span>
                      {entry.notes && (
                        <span className="text-[10px] text-[#a1a1aa]">
                          ({entry.notes})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setEditingId(entry.id)}
                      >
                        {t("common.edit")}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="xs"
                        onClick={() => handleDelete(entry.id)}
                      >
                        {t("common.delete")}
                      </Button>
                    </div>
                  </>
                )}
              </m.div>
            ))}
          </AnimatePresence>

          {showAddForm ? (
            <m.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 bg-white border border-[#e4e4e7] rounded-lg"
            >
              <ScheduleEntryForm
                dayNames={dayNames}
                onSave={() => {
                  setShowAddForm(false);
                  setSuccess(t("garbage.saveSuccess"));
                }}
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
              + {t("garbage.addScheduleEntry")}
            </Button>
          )}
        </section>

        <section>
          <h3 className="text-xs text-[#a1a1aa] tracking-wide mb-3">
            {t("garbage.dutyRotation")}
          </h3>

          <form
            onSubmit={handleGenerate}
            className="bg-white border border-[#e4e4e7] rounded-lg p-4 space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-[10px] text-[#a1a1aa] tracking-wide mb-1">
                  {t("garbage.startDate")}
                </label>
                <input
                  type="date"
                  value={rotationStartDate}
                  onChange={(e) => setRotationStartDate(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-white border border-[#e4e4e7] rounded-md text-sm text-[#18181b] focus:outline-none focus:border-[#18181b] transition-colors"
                />
              </div>
              <div className="w-32">
                <label className="block text-[10px] text-[#a1a1aa] tracking-wide mb-1">
                  {t("garbage.weeks")}
                </label>
                <input
                  type="number"
                  value={rotationWeeks}
                  onChange={(e) =>
                    setRotationWeeks(parseInt(e.target.value, 10) || 1)
                  }
                  min={1}
                  max={52}
                  required
                  className="w-full h-10 px-3 bg-white border border-[#e4e4e7] rounded-md text-sm text-[#18181b] focus:outline-none focus:border-[#18181b] transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isGenerating || !rotationStartDate}
            >
              {isGenerating
                ? t("garbage.generating")
                : t("garbage.generateRotation")}
            </Button>
          </form>
        </section>
      </div>
    </m.div>
  );
}

/**
 * スケジュールエントリ編集フォーム（インライン）
 */
function ScheduleEntryForm({
  initialData,
  dayNames,
  onSave,
  onCancel,
}: {
  initialData?: GarbageSchedule;
  dayNames: readonly string[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const t = useI18n();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState<GarbageScheduleInput>({
    garbage_type: initialData?.garbage_type ?? "",
    day_of_week: initialData?.day_of_week ?? 0,
    notes: initialData?.notes ?? null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setFormError("");

      try {
        const result = isEditing
          ? await updateGarbageScheduleEntry(initialData!.id, formData)
          : await createGarbageScheduleEntry(formData);

        if ("error" in result) {
          setFormError(result.error);
        } else {
          onSave();
        }
      } catch {
        setFormError(t("errors.serverError"));
      } finally {
        setIsLoading(false);
      }
    },
    [formData, isEditing, initialData, onSave, t]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      {formError && (
        <div className="py-1.5 px-2 border border-red-200 bg-red-50 text-[11px] text-red-600">
          {formError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-24">
          <label className="block text-[10px] text-[#a1a1aa] tracking-wide mb-1">
            {t("garbage.dayOfWeek")}
          </label>
          <select
            value={formData.day_of_week}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                day_of_week: parseInt(e.target.value, 10),
              }))
            }
            className="w-full h-9 px-2 bg-white border border-[#e4e4e7] rounded-md text-sm text-[#18181b] focus:outline-none focus:border-[#18181b] transition-colors"
          >
            {dayNames.map((name, index) => (
              <option key={index} value={index}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-[10px] text-[#a1a1aa] tracking-wide mb-1">
            {t("garbage.garbageType")}
          </label>
          <input
            type="text"
            value={formData.garbage_type}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                garbage_type: e.target.value,
              }))
            }
            required
            className="w-full h-9 px-2 bg-white border border-[#e4e4e7] rounded-md text-sm text-[#18181b] placeholder:text-[#d4d4d8] focus:outline-none focus:border-[#18181b] transition-colors"
            placeholder={t("garbage.garbageTypePlaceholder")}
          />
        </div>

        <div className="flex-1">
          <label className="block text-[10px] text-[#a1a1aa] tracking-wide mb-1">
            {t("garbage.notes")}
          </label>
          <input
            type="text"
            value={formData.notes ?? ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                notes: e.target.value || null,
              }))
            }
            className="w-full h-9 px-2 bg-white border border-[#e4e4e7] rounded-md text-sm text-[#18181b] placeholder:text-[#d4d4d8] focus:outline-none focus:border-[#18181b] transition-colors"
            placeholder={t("garbage.notesPlaceholder")}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="xs" disabled={isLoading}>
          {isLoading
            ? t("common.saving")
            : isEditing
              ? t("common.save")
              : t("garbage.add")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
