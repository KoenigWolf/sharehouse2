"use client";

import { useState, useMemo } from "react";
import type { Provider } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { signIn, signUp, requestPasswordReset } from "@/lib/auth/actions";
import { AUTH } from "@/lib/constants/config";
import { useI18n } from "@/hooks/use-i18n";
import { createClient } from "@/lib/supabase/client";

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
  const [isLineLoading, setIsLineLoading] = useState(false);
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

  const handleLineLogin = async () => {
    setError(null);
    setIsLineLoading(true);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "line" as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (oauthError) {
      setError(t("auth.lineLoginFailed"));
      setIsLineLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex">
        <div className="hidden lg:flex lg:w-1/2 bg-[#f4f4f5] items-center justify-center p-12">
          <div className="max-w-md">
            <h1 className="text-3xl font-light text-[#18181b] tracking-wider mb-6">
              SHARE HOUSE
            </h1>
            <p className="text-[#71717a] leading-relaxed text-sm">
              {t("auth.portalLead")}
              <br />
              {t("auth.portalSublead")}
            </p>
            <div className="mt-12 pt-12 border-t border-[#e4e4e7]">
              <p className="text-xs text-[#a1a1aa] leading-loose">
                {t("auth.portalDescriptionLine1")}
                <br />
                {t("auth.portalDescriptionLine2")}
                <br />
                {t("auth.portalDescriptionLine3")}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            <div className="lg:hidden text-center mb-12">
              <h1 className="text-xl font-light text-[#18181b] tracking-wider">
                SHARE HOUSE
              </h1>
              <p className="text-xs text-[#a1a1aa] mt-2">
                {t("auth.residentPortal")}
              </p>
            </div>

            <div className="relative mb-10">
              <div className="flex">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => switchMode("login")}
                  className={`flex-1 h-auto py-3 relative z-10 hover:bg-transparent ${
                    mode === "login" ? "text-[#18181b]" : "text-[#a1a1aa]"
                  }`}
                >
                  {t("auth.login")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => switchMode("signup")}
                  className={`flex-1 h-auto py-3 relative z-10 hover:bg-transparent ${
                    mode === "signup" ? "text-[#18181b]" : "text-[#a1a1aa]"
                  }`}
                >
                  {t("auth.signup")}
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#e4e4e7]" />
              <m.div
                className="absolute bottom-0 h-px bg-[#18181b]"
                initial={false}
                animate={{
                  left: mode === "login" ? "0%" : "50%",
                  width: "50%",
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
            </div>

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
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pb-6">
                      <label
                        htmlFor="name"
                        className="block text-xs text-[#71717a] tracking-wide"
                      >
                        {t("auth.name")}
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("auth.namePlaceholder")}
                        required
                        className="w-full h-12 px-4 bg-white border border-[#e4e4e7] rounded-md text-[#18181b] text-sm placeholder:text-[#d4d4d8] focus:outline-none focus:border-[#18181b] transition-colors"
                      />
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-xs text-[#71717a] tracking-wide"
                >
                  {t("auth.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  autoComplete="email"
                  className="w-full h-12 px-4 bg-white border border-[#e4e4e7] rounded-md text-[#18181b] text-sm placeholder:text-[#d4d4d8] focus:outline-none focus:border-[#18181b] transition-colors"
                />
              </div>

              {!(mode === "login" && isForgotMode) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-xs text-[#71717a] tracking-wide"
                    >
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
                        className="text-xs text-[#a1a1aa] hover:text-[#71717a] transition-colors"
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
                    className="w-full h-12 px-4 bg-white border border-[#e4e4e7] rounded-md text-[#18181b] text-sm placeholder:text-[#d4d4d8] focus:outline-none focus:border-[#18181b] transition-colors"
                  />
                  <AnimatePresence>
                    {mode === "signup" && (
                      <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pt-1 space-y-2"
                      >
                        <p className="text-xs text-[#a1a1aa]">
                          {t("auth.passwordHint")}
                        </p>
                        {password.length > 0 && (
                          <PasswordStrengthMeter password={password} />
                        )}
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {mode === "login" && isForgotMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(false);
                    setError(null);
                  }}
                  className="text-xs text-[#a1a1aa] hover:text-[#71717a] transition-colors"
                >
                  {t("auth.backToLogin")}
                </button>
              )}

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

              <AnimatePresence>
                {success && (
                  <m.div
                    role="status"
                    aria-live="polite"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="py-3 px-4 bg-[#f0fdf4] border-l-2 border-[#93c5a0]"
                  >
                    <p className="text-sm text-[#3d6b4a]">{success}</p>
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
                    {isForgotMode
                      ? t("auth.sendingResetLink")
                      : t("common.processing")}
                  </span>
                ) : isForgotMode ? (
                  t("auth.sendResetLink")
                ) : mode === "login" ? (
                  t("auth.login")
                ) : (
                  t("auth.register")
                )}
              </Button>
            </form>

            {!isForgotMode && (
              <div className="mt-6">
                <div className="flex items-center gap-3 text-[#a1a1aa] text-xs">
                  <span className="flex-1 h-px bg-[#e4e4e7]" />
                  <span>{t("auth.orContinueWith")}</span>
                  <span className="flex-1 h-px bg-[#e4e4e7]" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  onClick={handleLineLogin}
                  disabled={isLineLoading}
                  className="mt-4 w-full"
                >
                  {isLineLoading
                    ? t("common.processing")
                    : mode === "signup"
                      ? t("auth.signupWithLine")
                      : t("auth.loginWithLine")}
                </Button>
              </div>
            )}

            <AnimatePresence>
              {mode === "signup" && (
                <m.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                className="text-xs text-[#a1a1aa] text-center mt-8 leading-relaxed"
              >
                  {t("auth.signupHint")}
              </m.p>
            )}
            </AnimatePresence>
          </div>
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
