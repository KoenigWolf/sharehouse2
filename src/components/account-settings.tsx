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
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={`text-sm px-3 py-2 border-l-2 ${
            feedback.type === "success"
              ? "bg-[#f0fdf4] border-[#93c5a0] text-[#3d6b4a]"
              : "bg-[#fef2f2] border-[#e5a0a0] text-[#8b4040]"
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
      className="border border-[#e4e4e7] rounded-lg p-5 space-y-4"
    >
      <h3 className="text-sm font-medium text-[#18181b]">
        {t("account.password")}
      </h3>

      <div className="space-y-3">
        <div>
          <label htmlFor="current-password" className="block text-xs text-[#71717a] mb-1">
            {t("account.currentPassword")}
          </label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="current-password"
          />
        </div>

        <div>
          <label htmlFor="new-password" className="block text-xs text-[#71717a] mb-1">
            {t("account.newPassword")}
          </label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-xs text-[#71717a] mb-1">
            {t("account.confirmPassword")}
          </label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="new-password"
          />
        </div>
      </div>

      <FeedbackMessage feedback={feedback} />

      <Button
        type="submit"
        disabled={isSubmitting || !isValid}
        size="sm"
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
      className="border border-[#e4e4e7] rounded-lg p-5 space-y-4"
    >
      <h3 className="text-sm font-medium text-[#18181b]">
        {t("account.email")}
      </h3>

      {userEmail && (
        <p className="text-sm text-[#71717a]">
          <span className="text-xs text-[#a1a1aa]">
            {t("account.currentEmail")}:
          </span>{" "}
          {userEmail}
        </p>
      )}

      <div>
        <label htmlFor="new-email" className="block text-xs text-[#71717a] mb-1">
          {t("account.newEmail")}
        </label>
        <Input
          id="new-email"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          disabled={isSubmitting}
          autoComplete="email"
        />
      </div>

      <FeedbackMessage feedback={feedback} />

      <Button
        type="submit"
        disabled={isSubmitting || newEmail.length === 0}
        size="sm"
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
        // 成功時は isSubmitting を維持してリダイレクト（UI フラッシュ防止）
        window.location.href = "/login";
      }
    },
    [confirmText]
  );

  const isConfirmed = confirmText === "削除";

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-[#e5a0a0] rounded-lg p-5 space-y-4"
    >
      <h3 className="text-sm font-medium text-[#8b4040]">
        {t("account.deleteAccount")}
      </h3>

      <p className="text-sm text-[#8b4040] leading-relaxed">
        {t("account.deleteWarning")}
      </p>

      <div>
        <label htmlFor="delete-confirm" className="block text-xs text-[#71717a] mb-1">
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
        />
      </div>

      <FeedbackMessage feedback={feedback} />

      <Button
        type="submit"
        variant="destructive"
        disabled={isSubmitting || !isConfirmed}
        size="sm"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Spinner size="xs" />
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <h2 className="text-xs tracking-wide text-[#a1a1aa] uppercase">
        {t("account.sectionTitle")}
      </h2>

      <EmailSection userEmail={userEmail} />

      {hasPassword ? (
        <PasswordSection />
      ) : (
        <div className="border border-[#e4e4e7] rounded-lg p-5">
          <h3 className="text-sm font-medium text-[#18181b] mb-2">
            {t("account.password")}
          </h3>
          <p className="text-sm text-[#a1a1aa]">
            {t("account.noPasswordProvider")}
          </p>
        </div>
      )}

      <DeleteSection />
    </m.section>
  );
}
