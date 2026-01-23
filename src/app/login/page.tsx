"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      setSuccess(result.message || "確認メールを送信しました。メールのリンクをクリックしてからログインしてください");
      setMode("login");
      setIsLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const switchMode = (newMode: "login" | "signup") => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      {/* ヘッダー */}
      <header className="border-b border-[#e5e5e5] bg-white">
        <div className="container mx-auto px-6 h-16 flex items-center">
          <h1 className="text-lg tracking-wider text-[#1a1a1a]">SHARE HOUSE</h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-[#1a1a1a] tracking-wide">
              {mode === "login" ? "ログイン" : "新規登録"}
            </h2>
            <p className="text-sm text-[#737373] mt-2">
              住民専用ポータル
            </p>
          </div>

          {/* モード切り替え */}
          <div className="flex mb-8 border border-[#e5e5e5]">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 py-3 text-sm transition-colors ${
                mode === "login"
                  ? "bg-[#1a1a1a] text-white"
                  : "bg-white text-[#737373] hover:text-[#1a1a1a]"
              }`}
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-3 text-sm transition-colors ${
                mode === "signup"
                  ? "bg-[#1a1a1a] text-white"
                  : "bg-white text-[#737373] hover:text-[#1a1a1a]"
              }`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-5">
            {/* 名前（新規登録のみ） */}
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs text-[#737373] tracking-wide">
                  名前 <span className="text-[#b94a48]">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="山田 太郎"
                  required
                  className="h-12 border-[#e5e5e5] rounded-none bg-white focus:border-[#1a1a1a] focus:ring-0"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-[#737373] tracking-wide">
                メールアドレス <span className="text-[#b94a48]">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="h-12 border-[#e5e5e5] rounded-none bg-white focus:border-[#1a1a1a] focus:ring-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-[#737373] tracking-wide">
                パスワード <span className="text-[#b94a48]">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "10文字以上、大文字・小文字・数字を含む" : ""}
                required
                className="h-12 border-[#e5e5e5] rounded-none bg-white focus:border-[#1a1a1a] focus:ring-0"
              />
              {mode === "signup" && (
                <p className="text-xs text-[#a3a3a3]">10文字以上、大文字・小文字・数字を各1文字以上含めてください</p>
              )}
            </div>

            {error && (
              <div className="p-4 bg-[#fef2f2] border border-[#fecaca]">
                <p className="text-sm text-[#dc2626]">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-[#f0fdf4] border border-[#bbf7d0]">
                <p className="text-sm text-[#16a34a]">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#b94a48] hover:bg-[#a13f3d] text-white rounded-none font-normal tracking-wide"
            >
              {isLoading
                ? mode === "login"
                  ? "ログイン中..."
                  : "登録中..."
                : mode === "login"
                ? "ログイン"
                : "登録する"}
            </Button>
          </form>

          {mode === "signup" && (
            <p className="text-xs text-[#a3a3a3] text-center mt-6">
              登録後、プロフィールページで詳細情報を編集できます
            </p>
          )}
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t border-[#e5e5e5] bg-white">
        <div className="container mx-auto px-6 py-4">
          <p className="text-xs text-[#a3a3a3] text-center">
            Share House Portal
          </p>
        </div>
      </footer>
    </div>
  );
}
