"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { signIn, signUp, requestPasswordReset } from "@/lib/auth/actions";
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
  return Math.min(Math.round((score / 6) * 3), 3); // 0-3
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useI18n();
  const [isForgotMode, setIsForgotMode] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await requestPasswordReset(email);

    if ("error" in result) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setSuccess(t("auth.resetLinkSent"));
    setIsForgotMode(false);
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await signIn(email, password);

    if ("error" in result) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError(t("auth.nameRequired"));
      setIsLoading(false);
      return;
    }

    if (password.length < AUTH.passwordMinLength) {
      setError(t("auth.passwordMinLength", { min: AUTH.passwordMinLength }));
      setIsLoading(false);
      return;
    }

    const result = await signUp(name.trim(), email, password);

    if ("error" in result) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    if ("needsEmailConfirmation" in result && result.needsEmailConfirmation) {
      setSuccess(
        result.message ||
        t("auth.confirmationEmailSent")
      );
      setMode("login");
      setIsLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const switchMode = (newMode: "login" | "signup") => {
    if (mode === newMode) return;
    setMode(newMode);
    setIsForgotMode(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/30 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-[440px] space-y-8"
        >
          {/* Header/Logo Section */}
          <div className="text-center space-y-2">
            <m.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-light text-foreground tracking-wide"
            >
              Share<span className="text-brand-500">House</span>
            </m.h1>
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]"
            >
              {isForgotMode ? t("auth.forgotPassword") : t("auth.residentPortal")}
            </m.p>
          </div>

          {/* Form Card */}
          <div className="bg-card/70 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-border/50 border border-border/50">
            {/* Mode Switcher */}
            {!isForgotMode && (
              <div className="bg-secondary/50 p-1.5 rounded-2xl flex relative mb-10">
                <m.div
                  className="absolute inset-y-1.5 bg-card rounded-xl shadow-sm z-0"
                  initial={false}
                  animate={{
                    left: mode === "login" ? "6px" : "calc(50% + 3px)",
                    width: "calc(50% - 9px)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <button
                  onClick={() => switchMode("login")}
                  className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest relative z-10 transition-colors duration-300 ${mode === "login" ? "text-foreground" : "text-muted-foreground"
                    }`}
                >
                  {t("auth.login")}
                </button>
                <button
                  onClick={() => switchMode("signup")}
                  className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest relative z-10 transition-colors duration-300 ${mode === "signup" ? "text-foreground" : "text-muted-foreground"
                    }`}
                >
                  {t("auth.signup")}
                </button>
              </div>
            )}

            <form
              onSubmit={
                mode === "signup"
                  ? handleSignup
                  : isForgotMode
                    ? handleResetRequest
                    : handleLogin
              }
              className="space-y-6"
            >
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <m.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <label htmlFor="name" className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                      {t("auth.name")}
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("auth.namePlaceholder")}
                      required
                      className="w-full h-14 px-5 bg-card border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                  </m.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                  {t("auth.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  className="w-full h-14 px-5 bg-card border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
              </div>

              {!isForgotMode && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label htmlFor="password" className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {t("auth.password")}
                    </label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotMode(true);
                          setError(null);
                          setSuccess(null);
                        }}
                        className="text-[10px] font-bold text-muted-foreground hover:text-brand-500 transition-colors uppercase tracking-widest"
                      >
                        {t("auth.forgotPassword")}
                      </button>
                    )}
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="w-full h-14 px-5 bg-card border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  />
                  <AnimatePresence>
                    {mode === "signup" && password.length > 0 && (
                      <m.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="pt-2"
                      >
                        <PasswordStrengthMeter password={password} />
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {isForgotMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-[10px] font-black text-muted-foreground hover:text-foreground/80 transition-colors uppercase tracking-[0.2em] w-full text-center"
                >
                  ← {t("auth.backToLogin")}
                </button>
              )}

              <div className="pt-2">
                <AnimatePresence mode="wait">
                  {error && (
                    <m.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="mb-6 p-4 bg-error-bg/50 border border-error-border/20 rounded-2xl"
                    >
                      <p className="text-xs font-bold text-error text-center">{error}</p>
                    </m.div>
                  )}
                  {success && (
                    <m.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="mb-6 p-4 bg-success-bg/50 border border-success-border/20 rounded-2xl"
                    >
                      <p className="text-xs font-bold text-success text-center">{success}</p>
                    </m.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  size="xl"
                  disabled={isLoading}
                  className="w-full rounded-2xl shadow-xl shadow-brand-100/50 h-14 text-sm font-black uppercase tracking-widest bg-brand-500 hover:bg-brand-700 text-white transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Spinner size="sm" variant="light" />
                  ) : isForgotMode ? (
                    t("auth.sendResetLink")
                  ) : mode === "login" ? (
                    t("auth.login")
                  ) : (
                    t("auth.register")
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-10 pt-8 border-t border-border/50 flex flex-col items-center gap-6">
              {!isForgotMode && (
                <Link
                  href="/residents"
                  className="text-[10px] font-black text-muted-foreground hover:text-brand-500 transition-all uppercase tracking-[0.2em] flex items-center gap-2 group"
                >
                  {t("auth.browseAsGuest")}
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              )}
            </div>
          </div>

          {/* Tagline for Desktop-like feel */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center space-y-4"
          >
            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[280px] mx-auto">
              {t("auth.portalLead")}
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-6 bg-secondary" />
              <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">{t("auth.shareHousePortal")}</span>
              <span className="h-px w-6 bg-secondary" />
            </div>
          </m.div>
        </m.div>
      </main>

      <footer className="py-8 relative z-10">
        <p className="text-[10px] font-bold text-muted-foreground/70 text-center uppercase tracking-[0.3em]">
          © {new Date().getFullYear()}
        </p>
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
  const colors = [
    "bg-secondary",
    "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]",
    "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]",
    "bg-brand-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
  ];
  const textColors = [
    "text-muted-foreground/70",
    "text-red-500",
    "text-amber-500",
    "text-brand-500"
  ];

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 h-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-500 ${i <= strength ? colors[strength] : "bg-secondary"
              }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center h-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {t("auth.passwordHint")}
        </p>
        <p className={`text-[10px] font-black uppercase tracking-widest ${textColors[strength]}`}>
          {labels[strength]}
        </p>
      </div>
    </div>
  );
}
