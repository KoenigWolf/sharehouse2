"use client";

import { useState, useCallback } from "react";
import { m } from "framer-motion";
import { Lock, Mail, Trash2, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AnimatedFeedbackMessage } from "@/components/ui/feedback-message";
import { useI18n } from "@/hooks/use-i18n";
import { staggerContainer, staggerItem } from "@/lib/animation";
import { changePassword, changeEmail, deleteAccount } from "@/lib/account/actions";

interface AccountSettingsProps {
  userEmail: string | undefined;
  hasPassword: boolean;
}

interface Feedback {
  type: "success" | "error";
  message: string;
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
    <m.form
      variants={staggerItem}
      onSubmit={handleSubmit}
      className="premium-surface rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-border/50 space-y-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <Lock size={18} className="text-brand-500" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          {t("account.password")}
        </h3>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="current-password" className="block text-xs font-semibold text-muted-foreground ml-1">
            {t("account.currentPassword")}
          </label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="current-password"
            className="h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="new-password" className="block text-xs font-semibold text-muted-foreground ml-1">
            {t("account.newPassword")}
          </label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="new-password"
            className="h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-password" className="block text-xs font-semibold text-muted-foreground ml-1">
            {t("account.confirmPassword")}
          </label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="new-password"
            className="h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all"
          />
        </div>
      </div>

      {feedback && (
        <AnimatedFeedbackMessage
          show={true}
          type={feedback.type}
          message={feedback.message}
        />
      )}

      <m.button
        type="submit"
        disabled={isSubmitting || !isValid}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="h-12 px-8 rounded-xl bg-foreground text-background text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isSubmitting ? t("account.changingPassword") : t("account.changePassword")}
      </m.button>
    </m.form>
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
    <m.form
      variants={staggerItem}
      onSubmit={handleSubmit}
      className="premium-surface rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-border/50 space-y-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <Mail size={18} className="text-brand-500" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          {t("account.email")}
        </h3>
      </div>

      <div className="space-y-5">
        {userEmail && (
          <div className="px-5 py-4 bg-muted/50 rounded-xl border border-border/50">
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              {t("account.currentEmail")}
            </p>
            <p className="text-sm font-medium text-foreground">
              {userEmail}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="new-email" className="block text-xs font-semibold text-muted-foreground ml-1">
            {t("account.newEmail")}
          </label>
          <Input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={isSubmitting}
            autoComplete="email"
            className="h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all"
          />
        </div>
      </div>

      {feedback && (
        <AnimatedFeedbackMessage
          show={true}
          type={feedback.type}
          message={feedback.message}
        />
      )}

      <m.button
        type="submit"
        disabled={isSubmitting || newEmail.length === 0}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="h-12 px-8 rounded-xl bg-foreground text-background text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isSubmitting ? t("account.changingEmail") : t("account.changeEmail")}
      </m.button>
    </m.form>
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
    <m.form
      variants={staggerItem}
      onSubmit={handleSubmit}
      className="bg-error-bg/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-error/20 space-y-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
          <Trash2 size={18} className="text-error" />
        </div>
        <h3 className="text-sm font-semibold text-error">
          {t("account.deleteAccount")}
        </h3>
      </div>

      <p className="text-sm text-error/80 leading-relaxed">
        {t("account.deleteWarning")}
      </p>

      <div className="space-y-2">
        <label htmlFor="delete-confirm" className="block text-xs font-semibold text-error/70 ml-1">
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
          className="h-12 rounded-xl border-error/30 bg-card/50 focus:ring-2 focus:ring-error/10 focus:border-error/50 transition-all"
        />
      </div>

      {feedback && (
        <AnimatedFeedbackMessage
          show={true}
          type={feedback.type}
          message={feedback.message}
        />
      )}

      <m.button
        type="submit"
        disabled={isSubmitting || !isConfirmed}
        whileHover={isConfirmed ? { scale: 1.02 } : {}}
        whileTap={isConfirmed ? { scale: 0.98 } : {}}
        className="h-12 px-8 rounded-xl bg-error text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Spinner size="xs" variant="light" />
            {t("account.deleting")}
          </>
        ) : (
          t("account.deleteButton")
        )}
      </m.button>
    </m.form>
  );
}

export function AccountSettings({ userEmail, hasPassword }: AccountSettingsProps) {
  const t = useI18n();

  return (
    <m.section
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <m.div variants={staggerItem} className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Shield size={18} className="text-brand-500" />
          </div>
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            {t("account.sectionTitle")}
          </h2>
        </div>
        <div className="flex-1 h-px bg-border" />
      </m.div>

      <m.div variants={staggerContainer} className="space-y-6">
        <EmailSection userEmail={userEmail} />

        {hasPassword ? (
          <PasswordSection />
        ) : (
          <m.div
            variants={staggerItem}
            className="premium-surface rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-border/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                <Lock size={18} className="text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("account.password")}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("account.noPasswordProvider")}
            </p>
          </m.div>
        )}

        <DeleteSection />
      </m.div>
    </m.section>
  );
}
