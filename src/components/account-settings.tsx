"use client";

import { useState, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/use-i18n";
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
              ? "bg-green-50/50 border-green-200 text-green-600"
              : "bg-red-50/50 border-red-200 text-red-600"
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
      className="premium-surface rounded-[2rem] p-8 border border-slate-50 space-y-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          {t("account.password")}
        </h3>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="current-password" shaking-wide className="block text-[10px] font-bold text-slate-400 uppercase ml-1">
            {t("account.currentPassword")}
          </label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="current-password"
            className="h-12 rounded-2xl border-slate-200 focus:ring-brand-500/5 focus:border-brand-500/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="new-password" shaking-wide className="block text-[10px] font-bold text-slate-400 uppercase ml-1">
            {t("account.newPassword")}
          </label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="new-password"
            className="h-12 rounded-2xl border-slate-200 focus:ring-brand-500/5 focus:border-brand-500/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-password" shaking-wide className="block text-[10px] font-bold text-slate-400 uppercase ml-1">
            {t("account.confirmPassword")}
          </label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="new-password"
            className="h-12 rounded-2xl border-slate-200 focus:ring-brand-500/5 focus:border-brand-500/50"
          />
        </div>
      </div>

      <FeedbackMessage feedback={feedback} />

      <Button
        type="submit"
        disabled={isSubmitting || !isValid}
        size="lg"
        className="w-full sm:w-auto h-11 px-8 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold tracking-wider uppercase text-[11px] transition-all duration-300"
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
      className="premium-surface rounded-[2rem] p-8 border border-slate-50 space-y-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          {t("account.email")}
        </h3>
      </div>

      <div className="space-y-5">
        {userEmail && (
          <div className="px-5 py-3 bg-slate-50/50 rounded-2xl border border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
              {t("account.currentEmail")}
            </p>
            <p className="text-sm font-medium text-slate-600">
              {userEmail}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="new-email" className="block text-[10px] font-bold text-slate-400 uppercase ml-1">
            {t("account.newEmail")}
          </label>
          <Input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={isSubmitting}
            autoComplete="email"
            className="h-12 rounded-2xl border-slate-200 focus:ring-brand-500/5 focus:border-brand-500/50"
          />
        </div>
      </div>

      <FeedbackMessage feedback={feedback} />

      <Button
        type="submit"
        disabled={isSubmitting || newEmail.length === 0}
        size="lg"
        className="w-full sm:w-auto h-11 px-8 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold tracking-wider uppercase text-[11px] transition-all duration-300"
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

  const isConfirmed = confirmText === "削除";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-rose-50/30 rounded-[2rem] p-8 border border-rose-100 space-y-6"
    >
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <h3 className="text-[10px] font-bold tracking-widest text-rose-500 uppercase">
          {t("account.deleteAccount")}
        </h3>
      </div>

      <p className="text-xs font-medium text-rose-600/70 leading-relaxed max-w-sm">
        {t("account.deleteWarning")}
      </p>

      <div className="space-y-3">
        <label htmlFor="delete-confirm" className="block text-[10px] font-bold text-rose-400 uppercase ml-1">
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
          className="h-12 rounded-2xl border-rose-100 bg-white/50 focus:ring-rose-500/5 focus:border-rose-300"
        />
      </div>

      <FeedbackMessage feedback={feedback} />

      <Button
        type="submit"
        variant="destructive"
        disabled={isSubmitting || !isConfirmed}
        size="lg"
        className="w-full sm:w-auto h-11 px-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold tracking-wider uppercase text-[11px] transition-all duration-300 shadow-lg shadow-rose-100"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
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
        <h2 className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase whitespace-nowrap">
          {t("account.sectionTitle")}
        </h2>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      <div className="space-y-8">
        <EmailSection userEmail={userEmail} />

        {hasPassword ? (
          <PasswordSection />
        ) : (
          <div className="premium-surface rounded-[2rem] p-8 border border-slate-50 shadow-sm">
            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4">
              {t("account.password")}
            </h3>
            <p className="text-sm font-medium text-slate-400">
              {t("account.noPasswordProvider")}
            </p>
          </div>
        )}

        <DeleteSection />
      </div>
    </m.section>
  );
}
