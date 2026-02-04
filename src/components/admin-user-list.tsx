"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/hooks/use-i18n";
import { getInitials } from "@/lib/utils";
import { toggleAdminStatus, adminDeleteAccount } from "@/lib/admin/actions";
import type { Profile } from "@/domain/profile";

interface AdminUserListProps {
  profiles: Profile[];
  currentUserId: string;
}

export function AdminUserList({ profiles, currentUserId }: AdminUserListProps) {
  const t = useI18n();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter(
      (p) =>
        !deletedIds.has(p.id) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          (p.room_number && p.room_number.includes(q)))
    );
  }, [profiles, search, deletedIds]);

  const handleToggleAdmin = useCallback(
    async (profile: Profile) => {
      const confirmed = window.confirm(
        t("admin.confirmToggleAdmin", { name: profile.name })
      );
      if (!confirmed) return;

      setLoadingId(profile.id);
      setError("");
      setSuccess("");

      const result = await toggleAdminStatus(profile.id);

      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(t("admin.toggleSuccess"));
        router.refresh();
      }

      setLoadingId(null);
    },
    [t, router]
  );

  const openDeleteDialog = useCallback((profile: Profile) => {
    setDeleteError("");
    setDeleteTarget(profile);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
    setDeleteError("");
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setLoadingId(deleteTarget.id);
    setDeleteError("");
    setError("");
    setSuccess("");

    const result = await adminDeleteAccount(deleteTarget.id);

    setLoadingId(null);

    if ("error" in result) {
      setDeleteError(result.error);
      return;
    }

    setDeleteTarget(null);
    setDeleteError("");
    setDeletedIds((prev) => new Set(prev).add(deleteTarget.id));
    setSuccess(t("admin.deleteSuccess"));
    router.refresh();
  }, [deleteTarget, t, router]);

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("admin.search")}
        className="w-full h-10 px-3 bg-white border border-[#e4e4e7] rounded-md text-sm text-[#18181b] placeholder:text-[#d4d4d8] focus:outline-none focus:border-[#18181b] transition-colors"
      />

      <AnimatePresence mode="wait">
        {error && (
          <m.div
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="py-2 px-3 border-l-2 border-error-border bg-error-bg text-xs text-error"
          >
            {error}
          </m.div>
        )}
        {success && (
          <m.div
            key="success"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="py-2 px-3 border-l-2 border-success-border bg-success-bg text-xs text-success"
          >
            {success}
          </m.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 && (
        <p className="text-sm text-[#a1a1aa] py-8 text-center">
          {t("admin.noUsers")}
        </p>
      )}

      <div className="space-y-2">
        <AnimatePresence>
        {filtered.map((profile) => {
          const isSelf = profile.id === currentUserId;
          const isLoading = loadingId === profile.id;

          return (
            <m.div
              key={profile.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 px-4 py-3 bg-white border border-[#e4e4e7] rounded-lg"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <OptimizedAvatarImage
                  src={profile.avatar_url}
                  alt={profile.name}
                />
                <span className="flex h-full w-full items-center justify-center bg-[#f4f4f5] text-[10px] text-[#a1a1aa]">
                  {getInitials(profile.name)}
                </span>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#18181b] font-medium truncate">
                    {profile.name}
                  </span>
                  {profile.is_admin && (
                    <span className="text-[9px] font-bold tracking-wider text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded uppercase">
                      {t("admin.adminBadge")}
                    </span>
                  )}
                  {isSelf && (
                    <span className="text-[9px] text-[#a1a1aa]">
                      ({t("common.you")})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#a1a1aa]">
                  {profile.room_number && (
                    <span>{profile.room_number}</span>
                  )}
                  {profile.move_in_date && (
                    <span>{profile.move_in_date}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Link href={`/profile/${profile.id}/edit`}>
                  <Button type="button" variant="outline" size="xs">
                    {t("common.edit")}
                  </Button>
                </Link>
                {!isSelf && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => handleToggleAdmin(profile)}
                      disabled={isLoading}
                    >
                      {t("admin.toggleAdmin")}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="xs"
                      onClick={() => openDeleteDialog(profile)}
                      disabled={isLoading}
                    >
                      {t("admin.deleteAccount")}
                    </Button>
                  </>
                )}
              </div>
            </m.div>
          );
        })}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title={t("admin.confirmDeleteTitle")}
        description={t("admin.confirmDelete", { name: deleteTarget?.name ?? "" })}
        confirmLabel={t("admin.deleteAccount")}
        cancelLabel={t("common.cancel")}
        loadingLabel={t("admin.deleting")}
        isLoading={loadingId === deleteTarget?.id}
        error={deleteError}
        variant="destructive"
      >
        {deleteTarget && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Avatar className="h-10 w-10 shrink-0">
              <OptimizedAvatarImage
                src={deleteTarget.avatar_url}
                alt={deleteTarget.name}
              />
              <span className="flex h-full w-full items-center justify-center bg-[#f4f4f5] text-xs text-[#a1a1aa]">
                {getInitials(deleteTarget.name)}
              </span>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {deleteTarget.name}
              </p>
              {deleteTarget.room_number && (
                <p className="text-xs text-slate-400">
                  {deleteTarget.room_number}
                </p>
              )}
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
