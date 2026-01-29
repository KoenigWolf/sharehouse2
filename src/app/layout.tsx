import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerLocale } from "@/lib/i18n/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { MotionProvider } from "@/components/motion-provider";
import { UserProvider } from "@/hooks/use-user";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Share House",
  description: "住民専用ポータル",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, headersList] = await Promise.all([
    getServerLocale(),
    headers(),
  ]);
  const nonce = headersList.get("x-nonce") || undefined;

  let userId: string | null = null;
  let avatarUrl: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      avatarUrl = data?.avatar_url ?? null;
    }
  } catch {
    // 未認証ページ（/login 等）ではスキップ
  }

  return (
    <html lang={locale} nonce={nonce}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        nonce={nonce}
      >
        <UserProvider userId={userId} avatarUrl={avatarUrl}>
          <MotionProvider>{children}</MotionProvider>
        </UserProvider>
        <WebVitalsReporter />
      </body>
    </html>
  );
}
