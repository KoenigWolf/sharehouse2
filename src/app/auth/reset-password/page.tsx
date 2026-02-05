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
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-300/20 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h1 className="text-xl font-light text-slate-900 tracking-wider">
              SHARE HOUSE
            </h1>
            <p className="text-[10px] font-bold tracking-widest uppercase text-brand-600 mt-2">
              {t("auth.resetPassword")}
            </p>
          </div>

          <div className="premium-surface rounded-3xl p-8 sm:p-10">
            {isComplete ? (
              <m.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-12 h-12 bg-success-bg text-success rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {t("auth.passwordResetSuccess")}
                </p>
                <p className="text-xs text-slate-500">
                  {t("common.processing")}...
                </p>
              </m.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-xs text-slate-500 leading-relaxed text-center mb-2">
                  {t("auth.resetPasswordDescription")}
                </p>

                <div className="space-y-2">
                  <label
                    htmlFor="new-password"
                    className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase"
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
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-sm placeholder:text-slate-300 focus:outline-none focus:border-brand-500 focus:bg-white transition-all shadow-inner"
                  />
                  {password.length > 0 && (
                    <div className="pt-1">
                      <PasswordStrengthMeter password={password} />
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {t("auth.passwordHint")}
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirm-password"
                    className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase"
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
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-sm placeholder:text-slate-300 focus:outline-none focus:border-brand-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <m.div
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="py-2.5 px-4 bg-error-bg text-error text-[11px] font-semibold border border-error-border rounded-xl flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {error}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  size="xl"
                  disabled={isLoading}
                  className="w-full rounded-2xl shadow-lg shadow-brand-100 active:scale-[0.98] transition-transform"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2 font-bold tracking-tight">
                      <Spinner size="sm" variant="light" />
                      {t("auth.settingNewPassword")}
                    </span>
                  ) : (
                    <span className="font-bold tracking-tight">
                      {t("auth.setNewPassword")}
                    </span>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <a
                    href="/login"
                    className="text-[11px] font-bold text-slate-400 hover:text-brand-600 transition-colors uppercase tracking-widest"
                  >
                    {t("auth.backToLogin")}
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="py-8 relative z-10">
        <div className="flex items-center justify-center gap-2 text-slate-300">
          <span className="w-8 h-px bg-slate-200" />
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase">Share House Portal</p>
          <span className="w-8 h-px bg-slate-200" />
        </div>
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
  const colors = ["var(--error-border)", "var(--error-border)", "#d4d4d8", "var(--success-border)"];

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
