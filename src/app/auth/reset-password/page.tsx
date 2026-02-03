"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { updatePasswordAfterReset } from "@/lib/auth/actions";
import { AUTH } from "@/lib/constants/config";
import { useI18n } from "@/hooks/use-i18n";

function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(Math.round((score / 6) * 3), 3);
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const router = useRouter();
  const t = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    if (password.length < AUTH.passwordMinLength) {
      setError(t("auth.passwordMinLength", { min: AUTH.passwordMinLength }));
      return;
    }

    setIsLoading(true);
    const result = await updatePasswordAfterReset(password);

    if ("error" in result) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setIsComplete(true);
    setIsLoading(false);

    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-12">
            <h1 className="text-xl font-light text-[#18181b] tracking-wider">
              SHARE HOUSE
            </h1>
            <p className="text-xs text-[#a1a1aa] mt-2">
              {t("auth.resetPassword")}
            </p>
          </div>

          {isComplete ? (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="py-3 px-4 bg-[#f0fdf4] border-l-2 border-[#93c5a0]">
                <p className="text-sm text-[#3d6b4a]">
                  {t("auth.passwordResetSuccess")}
                </p>
              </div>
            </m.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-[#71717a]">
                {t("auth.resetPasswordDescription")}
              </p>

              <div className="space-y-2">
                <label
                  htmlFor="new-password"
                  className="block text-xs text-[#71717a] tracking-wide"
                >
                  {t("auth.newPassword")}
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full h-12 px-4 bg-white border border-[#e4e4e7] rounded-md text-[#18181b] text-sm placeholder:text-[#d4d4d8] focus:outline-none focus:border-[#18181b] transition-colors"
                />
                <p className="text-xs text-[#a1a1aa]">
                  {t("auth.passwordHint")}
                </p>
                {password.length > 0 && (
                  <PasswordStrengthMeter password={password} />
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="block text-xs text-[#71717a] tracking-wide"
                >
                  {t("auth.confirmNewPassword")}
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full h-12 px-4 bg-white border border-[#e4e4e7] rounded-md text-[#18181b] text-sm placeholder:text-[#d4d4d8] focus:outline-none focus:border-[#18181b] transition-colors"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <m.div
                    role="alert"
                    aria-live="polite"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="py-3 px-4 bg-[#fef2f2] border-l-2 border-[#e5a0a0]"
                  >
                    <p className="text-sm text-[#8b4040]">{error}</p>
                  </m.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                size="xl"
                disabled={isLoading}
                aria-busy={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" variant="light" />
                    {t("auth.settingNewPassword")}
                  </span>
                ) : (
                  t("auth.setNewPassword")
                )}
              </Button>

              <div className="text-center">
                <a
                  href="/login"
                  className="text-xs text-[#a1a1aa] hover:text-[#71717a] transition-colors"
                >
                  {t("auth.backToLogin")}
                </a>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="py-6">
        <p className="text-xs text-[#a1a1aa] text-center">Share House Portal</p>
      </footer>
    </div>
  );
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const t = useI18n();
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const labels = [
    t("auth.passwordStrength.weak"),
    t("auth.passwordStrength.weak"),
    t("auth.passwordStrength.fair"),
    t("auth.passwordStrength.strong"),
  ];
  const colors = ["#e5a0a0", "#e5a0a0", "#d4d4d8", "#93c5a0"];

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-0.5 flex-1 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: i < strength ? colors[strength] : "#e4e4e7",
            }}
          />
        ))}
      </div>
      <p className="text-[10px]" style={{ color: colors[strength] }}>
        {labels[strength]}
      </p>
    </div>
  );
}
