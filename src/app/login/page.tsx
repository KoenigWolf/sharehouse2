"use client";

import { useState, useMemo } from "react";
import type { Provider } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { signIn, signUp } from "@/lib/auth/actions";
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
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      {/* メインコンテンツ */}
      <main className="flex-1 flex">
        {/* 左側：ブランディング */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#f5f5f3] items-center justify-center p-12">
          <div className="max-w-md">
            <h1 className="text-3xl font-light text-[#1a1a1a] tracking-wider mb-6">
              SHARE HOUSE
            </h1>
            <p className="text-[#737373] leading-relaxed text-sm">
              {t("auth.portalLead")}
              <br />
              {t("auth.portalSublead")}
            </p>
            <div className="mt-12 pt-12 border-t border-[#e5e5e5]">
              <p className="text-xs text-[#a3a3a3] leading-loose">
                {t("auth.portalDescriptionLine1")}
                <br />
                {t("auth.portalDescriptionLine2")}
                <br />
                {t("auth.portalDescriptionLine3")}
              </p>
            </div>
          </div>
        </div>

        {/* 右側：フォーム */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            {/* モバイル用ロゴ */}
            <div className="lg:hidden text-center mb-12">
              <h1 className="text-xl font-light text-[#1a1a1a] tracking-wider">
                SHARE HOUSE
              </h1>
              <p className="text-xs text-[#a3a3a3] mt-2">
                {t("auth.residentPortal")}
              </p>
            </div>

            {/* モード切り替え */}
            <div className="relative mb-10">
              <div className="flex">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={`flex-1 py-3 text-sm tracking-wide transition-colors relative z-10 ${
                    mode === "login" ? "text-[#1a1a1a]" : "text-[#a3a3a3]"
                  }`}
                >
                  {t("auth.login")}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={`flex-1 py-3 text-sm tracking-wide transition-colors relative z-10 ${
                    mode === "signup" ? "text-[#1a1a1a]" : "text-[#a3a3a3]"
                  }`}
                >
                  {t("auth.signup")}
                </button>
              </div>
              {/* アンダーライン */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#e5e5e5]" />
              <m.div
                className="absolute bottom-0 h-px bg-[#1a1a1a]"
                initial={false}
                animate={{
                  left: mode === "login" ? "0%" : "50%",
                  width: "50%",
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
            </div>

            {/* フォーム */}
            <form
              onSubmit={mode === "login" ? handleLogin : handleSignup}
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
                        className="block text-xs text-[#737373] tracking-wide"
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
                        className="w-full h-12 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
                      />
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-xs text-[#737373] tracking-wide"
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
                  className="w-full h-12 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-xs text-[#737373] tracking-wide"
                >
                  {t("auth.password")}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full h-12 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
                />
                <AnimatePresence>
                  {mode === "signup" && (
                    <m.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="pt-1 space-y-2"
                    >
                      <p className="text-xs text-[#a3a3a3]">
                        {t("auth.passwordHint")}
                      </p>
                      {password.length > 0 && (
                        <PasswordStrengthMeter password={password} />
                      )}
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              {/* エラー・成功メッセージ */}
              <AnimatePresence>
                {error && (
                  <m.div
                    role="alert"
                    aria-live="polite"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="py-3 px-4 bg-[#faf8f8] border-l-2 border-[#c9a0a0]"
                  >
                    <p className="text-sm text-[#8b6b6b]">{error}</p>
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
                    className="py-3 px-4 bg-[#f8faf8] border-l-2 border-[#a0c9a0]"
                  >
                    <p className="text-sm text-[#6b8b6b]">{success}</p>
                  </m.div>
                )}
              </AnimatePresence>

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                aria-label={
                  isLoading
                    ? mode === "login"
                      ? t("a11y.loggingIn")
                      : t("a11y.signingUp")
                    : mode === "login"
                    ? t("auth.login")
                    : t("auth.register")
                }
                className="w-full h-12 bg-[#1a1a1a] text-white text-sm tracking-wide hover:bg-[#333] disabled:bg-[#a3a3a3] disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <m.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="inline-block w-4 h-4 border border-white/30 border-t-white rounded-full"
                    />
                    {t("common.processing")}
                  </span>
                ) : mode === "login" ? (
                  t("auth.login")
                ) : (
                  t("auth.register")
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="flex items-center gap-3 text-[#a3a3a3] text-xs">
                <span className="flex-1 h-px bg-[#e5e5e5]" />
                <span>{t("auth.orContinueWith")}</span>
                <span className="flex-1 h-px bg-[#e5e5e5]" />
              </div>
              <button
                type="button"
                onClick={handleLineLogin}
                disabled={isLineLoading}
                className="mt-4 w-full h-12 border border-[#e5e5e5] text-[#1a1a1a] text-sm tracking-wide hover:border-[#1a1a1a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isLineLoading
                  ? t("common.processing")
                  : mode === "signup"
                    ? t("auth.signupWithLine")
                    : t("auth.loginWithLine")}
              </button>
            </div>

            {/* 補足テキスト */}
            <AnimatePresence>
              {mode === "signup" && (
                <m.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                className="text-xs text-[#a3a3a3] text-center mt-8 leading-relaxed"
              >
                  {t("auth.signupHint")}
              </m.p>
            )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="py-6">
        <p className="text-xs text-[#a3a3a3] text-center">Share House Portal</p>
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
  const colors = ["#c9a0a0", "#c9a0a0", "#c9b980", "#a0c9a0"];

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-0.5 flex-1 transition-colors duration-300"
            style={{
              backgroundColor: i < strength ? colors[strength] : "#e5e5e5",
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
