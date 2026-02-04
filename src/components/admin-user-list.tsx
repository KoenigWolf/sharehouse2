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

const EASE = [0.23, 1, 0.32, 1] as const;

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
  const [adminToggleTarget, setAdminToggleTarget] = useState<Profile | null>(
    null,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter(
      (p) =>
        !deletedIds.has(p.id) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          (p.room_number && p.room_number.includes(q))),
    );
  }, [profiles, search, deletedIds]);

  const openAdminToggleDialog = useCallback((profile: Profile) => {
    setAdminToggleTarget(profile);
  }, []);

  const cancelAdminToggle = useCallback(() => {
    setAdminToggleTarget(null);
  }, []);

  const confirmAdminToggle = useCallback(async () => {
    if (!adminToggleTarget) return;

    setLoadingId(adminToggleTarget.id);
    setError("");
    setSuccess("");

    const result = await toggleAdminStatus(adminToggleTarget.id);

    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(t("admin.toggleSuccess"));
      router.refresh();
    }

    setLoadingId(null);
    setAdminToggleTarget(null);
  }, [adminToggleTarget, t, router]);

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
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.search")}
          className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
        />
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <m.div
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-xs font-medium px-4 py-3 rounded-xl border-l-4 bg-error-bg/50 border-error-border text-error"
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
            transition={{ duration: 0.2 }}
            className="text-xs font-medium px-4 py-3 rounded-xl border-l-4 bg-success-bg/50 border-success-border text-success"
          >
            {success}
          </m.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <SearchIcon className="w-8 h-8 text-slate-300 mb-4" />
          <p className="text-sm font-medium text-slate-500">
            {t("admin.noUsers")}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {t("admin.noUsersDescription")}
          </p>
        </m.div>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((profile, index) => {
            const isSelf = profile.id === currentUserId;
            const isLoading = loadingId === profile.id;

            return (
              <m.div
                key={profile.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  height: 0,
                  marginBottom: 0,
                  overflow: "hidden",
                }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(index * 0.04, 0.4),
                  ease: EASE,
                }}
                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 bg-white border border-slate-100 rounded-2xl transition-shadow duration-300 hover:shadow-md"
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <OptimizedAvatarImage
                    src={profile.avatar_url}
                    alt={profile.name}
                  />
                  <span className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] text-slate-400">
                    {getInitials(profile.name)}
                  </span>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-900 font-medium truncate">
                      {profile.name}
                    </span>
                    {profile.is_admin && (
                      <span className="text-[9px] font-bold tracking-wider text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded uppercase">
                        {t("admin.adminBadge")}
                      </span>
                    )}
                    {isSelf && (
                      <span className="text-[9px] text-slate-400">
                        ({t("common.you")})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    {profile.room_number && <span>{profile.room_number}</span>}
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
                        onClick={() => openAdminToggleDialog(profile)}
                        disabled={isLoading}
                      >
                        {profile.is_admin
                          ? t("admin.toggleAdminRevoke")
                          : t("admin.toggleAdminGrant")}
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
        isOpen={adminToggleTarget !== null}
        onConfirm={confirmAdminToggle}
        onCancel={cancelAdminToggle}
        title={t("admin.confirmToggleAdminTitle")}
        description={t("admin.confirmToggleAdminDescription", {
          name: adminToggleTarget?.name ?? "",
          action: adminToggleTarget?.is_admin
            ? t("admin.revokeAdmin")
            : t("admin.grantAdmin"),
        })}
        confirmLabel={
          adminToggleTarget?.is_admin
            ? t("admin.toggleAdminRevoke")
            : t("admin.toggleAdminGrant")
        }
        cancelLabel={t("common.cancel")}
        isLoading={loadingId === adminToggleTarget?.id}
      >
        {adminToggleTarget && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Avatar className="h-10 w-10 shrink-0">
              <OptimizedAvatarImage
                src={adminToggleTarget.avatar_url}
                alt={adminToggleTarget.name}
              />
              <span className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-slate-400">
                {getInitials(adminToggleTarget.name)}
              </span>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {adminToggleTarget.name}
              </p>
              {adminToggleTarget.room_number && (
                <p className="text-xs text-slate-400">
                  {adminToggleTarget.room_number}
                </p>
              )}
            </div>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title={t("admin.confirmDeleteTitle")}
        description={t("admin.confirmDelete", {
          name: deleteTarget?.name ?? "",
        })}
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
              <span className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-slate-400">
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.5 10.5L14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
