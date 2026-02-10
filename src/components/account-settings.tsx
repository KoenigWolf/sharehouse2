"use client";

import { useState, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Lock, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/use-i18n";
import { ICON_SIZE, ICON_STROKE, ICON_GAP } from "@/lib/constants/icons";
import { changePassword, changeEmail, deleteAccount } from "@/lib/account/actions";

interface AccountSettingsProps {
  userEmail: string | undefined;
  hasPassword: boolean;
}

interface Feedback {
  type: "success" | "error";
  message: string;
}

function FeedbackMessage({ feedback }: { feedback: Feedback | null }) {
  return (
    <AnimatePresence>
      {feedback && (
        <m.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={`text-xs font-medium px-4 py-3 rounded-xl border-l-4 ${feedback.type === "success"
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

function PasswordSection() {
  const t = useI18n();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFeedback(null);

      if (newPassword !== confirmPassword) {
        setFeedback({ type: "error", message: t("account.passwordMismatch") });
        return;
      }

      setIsSubmitting(true);
      const result = await changePassword(currentPassword, newPassword);
      setIsSubmitting(false);

      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: t("account.passwordChanged") });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    },
    [currentPassword, newPassword, confirmPassword, t]
  );

  const isValid =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="premium-surface rounded-[2rem] p-8 border border-border/50 space-y-6 shadow-sm"
    >
      <div className={`flex items-center ${ICON_GAP.md} mb-2`}>
        <Lock size={ICON_SIZE.md} strokeWidth={ICON_STROKE.normal} className="text-brand-500" />
        <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          {t("account.password")}
        </h3>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="current-password" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wide ml-1">
            {t("account.currentPassword")}
          </label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="current-password"
            className="h-12 rounded-2xl border-border focus:ring-brand-500/5 focus:border-brand-500/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="new-password" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wide ml-1">
            {t("account.newPassword")}
          </label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="new-password"
            className="h-12 rounded-2xl border-border focus:ring-brand-500/5 focus:border-brand-500/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-password" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wide ml-1">
            {t("account.confirmPassword")}
          </label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="new-password"
            className="h-12 rounded-2xl border-border focus:ring-brand-500/5 focus:border-brand-500/50"
          />
        </div>
      </div>

      <FeedbackMessage feedback={feedback} />

      <Button
        type="submit"
        disabled={isSubmitting || !isValid}
        size="lg"
        className="w-full sm:w-auto h-11 px-8 rounded-full bg-brand-500 hover:bg-brand-700 text-white font-bold tracking-wider uppercase text-[11px] transition-all duration-300"
      >
        {isSubmitting ? t("account.changingPassword") : t("account.changePassword")}
      </Button>
    </form>
  );
}

function EmailSection({ userEmail }: { userEmail: string | undefined }) {
  const t = useI18n();
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFeedback(null);
      setIsSubmitting(true);
      const result = await changeEmail(newEmail);
      setIsSubmitting(false);

      if ("error" in result) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: t("account.emailChangeSuccess") });
        setNewEmail("");
      }
    },
    [newEmail, t]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="premium-surface rounded-[2rem] p-8 border border-border/50 space-y-6 shadow-sm"
    >
      <div className={`flex items-center ${ICON_GAP.md} mb-2`}>
        <Mail size={ICON_SIZE.md} strokeWidth={ICON_STROKE.normal} className="text-brand-500" />
        <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          {t("account.email")}
        </h3>
      </div>

      <div className="space-y-5">
        {userEmail && (
          <div className="px-5 py-3 bg-muted/50 rounded-2xl border border-border">
            <p className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase mb-1">
              {t("account.currentEmail")}
            </p>
            <p className="text-sm font-medium text-foreground/80">
              {userEmail}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="new-email" className="block text-[10px] font-bold text-muted-foreground uppercase ml-1">
            {t("account.newEmail")}
          </label>
          <Input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={isSubmitting}
            autoComplete="email"
            className="h-12 rounded-2xl border-border focus:ring-brand-500/5 focus:border-brand-500/50"
          />
        </div>
      </div>

      <FeedbackMessage feedback={feedback} />

      <Button
        type="submit"
        disabled={isSubmitting || newEmail.length === 0}
        size="lg"
        className="w-full sm:w-auto h-11 px-8 rounded-full bg-brand-500 hover:bg-brand-700 text-white font-bold tracking-wider uppercase text-[11px] transition-all duration-300"
      >
        {isSubmitting ? t("account.changingEmail") : t("account.changeEmail")}
      </Button>
    </form>
  );
}

function DeleteSection() {
  const t = useI18n();
  const [confirmText, setConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFeedback(null);
      setIsSubmitting(true);
      const result = await deleteAccount(confirmText);

      if ("error" in result) {
        setIsSubmitting(false);
        setFeedback({ type: "error", message: result.error });
      } else {
        window.location.href = "/login";
      }
    },
    [confirmText]
  );

  const isConfirmed = confirmText === t("account.deleteConfirmPlaceholder");

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-error-bg/50 rounded-[2rem] p-8 border border-error-border/50 space-y-6"
    >
      <div className={`flex items-center ${ICON_GAP.md} mb-2`}>
        <Trash2 size={ICON_SIZE.md} strokeWidth={ICON_STROKE.normal} className="text-error" />
        <h3 className="text-[10px] font-bold tracking-widest text-error uppercase">
          {t("account.deleteAccount")}
        </h3>
      </div>

      <p className="text-xs font-medium text-error/80 leading-relaxed max-w-sm">
        {t("account.deleteWarning")}
      </p>

      <div className="space-y-3">
        <label htmlFor="delete-confirm" className="block text-[10px] font-bold text-error/70 uppercase ml-1">
          {t("account.deleteConfirmLabel")}
        </label>
        <Input
          id="delete-confirm"
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={t("account.deleteConfirmPlaceholder")}
          disabled={isSubmitting}
          autoComplete="off"
          className="h-12 rounded-2xl border-error-border/50 bg-card/50 focus:ring-error/5 focus:border-error/50"
        />
      </div>

      <FeedbackMessage feedback={feedback} />

      <Button
        type="submit"
        variant="destructive"
        disabled={isSubmitting || !isConfirmed}
        size="lg"
        className="w-full sm:w-auto h-11 px-8 rounded-full bg-error hover:bg-error/90 text-white font-bold tracking-wider uppercase text-[11px] transition-all duration-300 shadow-lg shadow-error/10"
      >
        {isSubmitting ? (
          <span className={`flex items-center ${ICON_GAP.xs}`}>
            <Spinner size="xs" variant="light" />
            {t("account.deleting")}
          </span>
        ) : (
          t("account.deleteButton")
        )}
      </Button>
    </form>
  );
}

export function AccountSettings({ userEmail, hasPassword }: AccountSettingsProps) {
  const t = useI18n();

  return (
    <m.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-12 py-8"
    >
      <div className="flex items-center gap-4">
        <h2 className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase whitespace-nowrap">
          {t("account.sectionTitle")}
        </h2>
        <div className="flex-1 h-px bg-secondary" />
      </div>

      <div className="space-y-8">
        <EmailSection userEmail={userEmail} />

        {hasPassword ? (
          <PasswordSection />
        ) : (
          <div className="premium-surface rounded-[2rem] p-8 border border-border/50 shadow-sm">
            <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-4">
              {t("account.password")}
            </h3>
            <p className="text-sm font-medium text-muted-foreground">
              {t("account.noPasswordProvider")}
            </p>
          </div>
        )}

        <DeleteSection />
      </div>
    </m.section>
  );
}
