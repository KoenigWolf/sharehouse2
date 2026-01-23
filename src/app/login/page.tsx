"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, signUp } from "@/lib/auth/actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
      setError("名前を入力してください");
      setIsLoading(false);
      return;
    }

    if (password.length < 10) {
      setError("パスワードは10文字以上で入力してください");
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
          "確認メールを送信しました。メールのリンクをクリックしてからログインしてください"
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
              住民同士のつながりを大切にする
              <br />
              シェアハウスのためのポータルサイト
            </p>
            <div className="mt-12 pt-12 border-t border-[#e5e5e5]">
              <p className="text-xs text-[#a3a3a3] leading-loose">
                顔と名前を覚えて、
                <br />
                声をかけやすい関係をつくる。
                <br />
                それがこのポータルの目的です。
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
              <p className="text-xs text-[#a3a3a3] mt-2">住民専用ポータル</p>
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
                  ログイン
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={`flex-1 py-3 text-sm tracking-wide transition-colors relative z-10 ${
                    mode === "signup" ? "text-[#1a1a1a]" : "text-[#a3a3a3]"
                  }`}
                >
                  新規登録
                </button>
              </div>
              {/* アンダーライン */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#e5e5e5]" />
              <motion.div
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
                  <motion.div
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
                        名前
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="山田 太郎"
                        required
                        className="w-full h-12 px-4 bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#d4d4d4] focus:outline-none focus:border-[#1a1a1a] transition-colors"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-xs text-[#737373] tracking-wide"
                >
                  メールアドレス
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
                  パスワード
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
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-[#a3a3a3] pt-1"
                    >
                      10文字以上、大文字・小文字・数字を含む
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* エラー・成功メッセージ */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="py-3 px-4 bg-[#faf8f8] border-l-2 border-[#c9a0a0]"
                  >
                    <p className="text-sm text-[#8b6b6b]">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="py-3 px-4 bg-[#f8faf8] border-l-2 border-[#a0c9a0]"
                  >
                    <p className="text-sm text-[#6b8b6b]">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#1a1a1a] text-white text-sm tracking-wide hover:bg-[#333] disabled:bg-[#a3a3a3] disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="inline-block w-4 h-4 border border-white/30 border-t-white rounded-full"
                    />
                    処理中
                  </span>
                ) : mode === "login" ? (
                  "ログイン"
                ) : (
                  "登録する"
                )}
              </button>
            </form>

            {/* 補足テキスト */}
            <AnimatePresence>
              {mode === "signup" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-[#a3a3a3] text-center mt-8 leading-relaxed"
                >
                  登録後、プロフィールページで
                  <br />
                  詳細情報を編集できます
                </motion.p>
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
