"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/hooks/use-i18n";
import { getInitials } from "@/lib/utils";
import {
  toggleAdminStatus,
  adminDeleteAccount,
  adminGetUserEmail,
  adminUpdateUserEmail,
  adminUpdateUserPassword,
} from "@/lib/admin/actions";
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
  const [credentialsTarget, setCredentialsTarget] = useState<Profile | null>(
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
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.search")}
          className="w-full h-12 pl-11 pr-4 bg-white border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
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
          <SearchIcon className="w-8 h-8 text-muted-foreground/70 mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            {t("admin.noUsers")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
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
                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 bg-white border border-border rounded-2xl transition-shadow duration-300 hover:shadow-md"
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <OptimizedAvatarImage
                    src={profile.avatar_url}
                    alt={profile.name}
                  />
                  <span className="flex h-full w-full items-center justify-center bg-secondary text-[10px] text-muted-foreground">
                    {getInitials(profile.name)}
                  </span>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground font-medium truncate">
                      {profile.name}
                    </span>
                    {profile.is_admin && (
                      <span className="text-[9px] font-bold tracking-wider text-brand-500 bg-primary/10 px-1.5 py-0.5 rounded uppercase">
                        {t("admin.adminBadge")}
                      </span>
                    )}
                    {isSelf && (
                      <span className="text-[9px] text-muted-foreground">
                        ({t("common.you")})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {profile.room_number && <span>{profile.room_number}</span>}
                    {profile.move_in_date && (
                      <span>{profile.move_in_date}</span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col sm:flex-row items-end sm:items-center gap-1.5">
                  <Link href={`/profile/${profile.id}/edit`}>
                    <Button type="button" variant="outline" size="xs">
                      {t("common.edit")}
                    </Button>
                  </Link>
                  {!isSelf && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setCredentialsTarget(profile)}
                        disabled={isLoading}
                      >
                        {t("admin.credentials")}
                      </Button>
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
                    </div>
                  )}
                </div>
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AdminCredentialsDialog
        key={credentialsTarget?.id ?? "closed"}
        target={credentialsTarget}
        onClose={() => setCredentialsTarget(null)}
      />

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
          <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
            <Avatar className="h-10 w-10 shrink-0">
              <OptimizedAvatarImage
                src={adminToggleTarget.avatar_url}
                alt={adminToggleTarget.name}
              />
              <span className="flex h-full w-full items-center justify-center bg-secondary text-xs text-muted-foreground">
                {getInitials(adminToggleTarget.name)}
              </span>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {adminToggleTarget.name}
              </p>
              {adminToggleTarget.room_number && (
                <p className="text-xs text-muted-foreground">
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
          <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
            <Avatar className="h-10 w-10 shrink-0">
              <OptimizedAvatarImage
                src={deleteTarget.avatar_url}
                alt={deleteTarget.name}
              />
              <span className="flex h-full w-full items-center justify-center bg-secondary text-xs text-muted-foreground">
                {getInitials(deleteTarget.name)}
              </span>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {deleteTarget.name}
              </p>
              {deleteTarget.room_number && (
                <p className="text-xs text-muted-foreground">
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

interface AdminCredentialsDialogProps {
  target: Profile | null;
  onClose: () => void;
}

function AdminCredentialsDialog({
  target,
  onClose,
}: AdminCredentialsDialogProps) {
  const t = useI18n();
  const isOpen = target !== null;

  const [currentEmail, setCurrentEmail] = useState("");
  const [isLoadingEmail, setIsLoadingEmail] = useState(target !== null);

  const [newEmail, setNewEmail] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!target) return;

    let cancelled = false;

    adminGetUserEmail(target.id).then((result) => {
      if (cancelled) return;
      setIsLoadingEmail(false);
      if ("error" in result) {
        setEmailFeedback({ type: "error", message: result.error });
      } else {
        setCurrentEmail(result.email);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [target]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!target || !newEmail) return;

      setEmailFeedback(null);
      setIsSubmittingEmail(true);

      const result = await adminUpdateUserEmail(target.id, newEmail);

      setIsSubmittingEmail(false);

      if ("error" in result) {
        setEmailFeedback({ type: "error", message: result.error });
      } else {
        setEmailFeedback({
          type: "success",
          message: t("admin.emailUpdateSuccess"),
        });
        setCurrentEmail(newEmail.toLowerCase().trim());
        setNewEmail("");
      }
    },
    [target, newEmail, t],
  );

  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!target || !newPassword) return;

      if (newPassword !== confirmPassword) {
        setPasswordFeedback({
          type: "error",
          message: t("admin.passwordMismatch"),
        });
        return;
      }

      setPasswordFeedback(null);
      setIsSubmittingPassword(true);

      const result = await adminUpdateUserPassword(target.id, newPassword);

      setIsSubmittingPassword(false);

      if ("error" in result) {
        setPasswordFeedback({ type: "error", message: result.error });
      } else {
        setPasswordFeedback({
          type: "success",
          message: t("admin.passwordUpdateSuccess"),
        });
        setNewPassword("");
        setConfirmPassword("");
      }
    },
    [target, newPassword, confirmPassword, t],
  );

  const isSubmitting = isSubmittingEmail || isSubmittingPassword;

  return (
    <AnimatePresence>
      {isOpen && target && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={isSubmitting ? undefined : onClose}
        >
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="w-full max-w-md bg-white rounded-2xl premium-surface p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold tracking-tight text-foreground">
                {t("admin.credentialsTitle")}
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("admin.credentialsDescription", { name: target.name })}
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
              <Avatar className="h-10 w-10 shrink-0">
                <OptimizedAvatarImage
                  src={target.avatar_url}
                  alt={target.name}
                />
                <span className="flex h-full w-full items-center justify-center bg-secondary text-xs text-muted-foreground">
                  {getInitials(target.name)}
                </span>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {target.name}
                </p>
                {target.room_number && (
                  <p className="text-xs text-muted-foreground">
                    {target.room_number}
                  </p>
                )}
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="flex items-center gap-2">
                <MailIcon className="w-3.5 h-3.5 text-brand-500" />
                <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  {t("admin.newEmail")}
                </h3>
              </div>

              {isLoadingEmail ? (
                <div className="flex items-center gap-2 px-5 py-3 bg-muted/50 rounded-2xl border border-border">
                  <Spinner size="xs" />
                  <span className="text-xs text-muted-foreground">
                    {t("admin.loadingEmail")}
                  </span>
                </div>
              ) : (
                currentEmail && (
                  <div className="px-5 py-3 bg-muted/50 rounded-2xl border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">
                      {t("admin.currentEmailLabel")}
                    </p>
                    <p className="text-sm font-medium text-foreground/80 break-all">
                      {currentEmail}
                    </p>
                  </div>
                )
              )}

              <div className="space-y-1.5">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t("admin.newEmail")}
                  disabled={isSubmittingEmail}
                  autoComplete="off"
                  className="h-12 rounded-2xl border-border focus:ring-brand-500/5 focus:border-brand-500/50"
                />
              </div>

              <FeedbackInline feedback={emailFeedback} />

              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingEmail || !newEmail}
                className="w-full sm:w-auto"
              >
                {isSubmittingEmail
                  ? t("admin.updatingEmail")
                  : t("admin.updateEmail")}
              </Button>
            </form>

            <div className="border-t border-border" />

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div className="flex items-center gap-2">
                <LockIcon className="w-3.5 h-3.5 text-brand-500" />
                <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  {t("admin.newPassword")}
                </h3>
              </div>

              <div className="space-y-2">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("admin.newPassword")}
                  disabled={isSubmittingPassword}
                  autoComplete="new-password"
                  className="h-12 rounded-2xl border-border focus:ring-brand-500/5 focus:border-brand-500/50"
                />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("admin.confirmNewPassword")}
                  disabled={isSubmittingPassword}
                  autoComplete="new-password"
                  className="h-12 rounded-2xl border-border focus:ring-brand-500/5 focus:border-brand-500/50"
                />
                <p className="text-[10px] text-muted-foreground ml-1">
                  {t("admin.passwordHint")}
                </p>
              </div>

              <FeedbackInline feedback={passwordFeedback} />

              <Button
                type="submit"
                size="sm"
                disabled={
                  isSubmittingPassword || !newPassword || !confirmPassword
                }
                className="w-full sm:w-auto"
              >
                {isSubmittingPassword
                  ? t("admin.updatingPassword")
                  : t("admin.updatePassword")}
              </Button>
            </form>

            <div className="border-t border-border pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full"
              >
                {t("admin.close")}
              </Button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

function FeedbackInline({
  feedback,
}: {
  feedback: { type: "success" | "error"; message: string } | null;
}) {
  return (
    <AnimatePresence>
      {feedback && (
        <m.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={`text-xs font-medium px-4 py-2.5 rounded-xl border-l-4 ${feedback.type === "success"
              ? "bg-success-bg/50 border-success-border text-success"
              : "bg-error-bg/50 border-error-border text-error"
            }`}
        >
          {feedback.message}
        </m.div>
      )}
    </AnimatePresence>
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

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}
