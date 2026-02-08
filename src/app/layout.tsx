import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Lato } from "next/font/google";
import { getServerLocale } from "@/lib/i18n/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { MotionProvider } from "@/components/motion-provider";
import { UserProvider } from "@/hooks/use-user";
import { ThemeProvider, ThemeScript, type ThemeStyle, type ColorMode } from "@/hooks/use-theme";
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

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Share House",
  description: "住民専用ポータル",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f8fafc",
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
  let isAdmin = false;
  let themeStyle: ThemeStyle | null = null;
  let colorMode: ColorMode | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, is_admin, theme_style, color_mode")
        .eq("id", user.id)
        .single();
      avatarUrl = data?.avatar_url ?? null;
      isAdmin = data?.is_admin === true;
      themeStyle = (data?.theme_style as ThemeStyle) ?? null;
      colorMode = (data?.color_mode as ColorMode) ?? null;
    }
  } catch {
    // 未認証ページ（/login 等）ではスキップ
  }

  return (
    <html lang={locale} nonce={nonce} suppressHydrationWarning>
      <head>
        <ThemeScript initialTheme={themeStyle} initialColorMode={colorMode} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lato.variable} antialiased`}
        nonce={nonce}
      >
        <ThemeProvider
          initialTheme={themeStyle}
          initialColorMode={colorMode}
          isLoggedIn={!!userId}
        >
          <UserProvider userId={userId} avatarUrl={avatarUrl} isAdmin={isAdmin}>
            <MotionProvider>{children}</MotionProvider>
          </UserProvider>
        </ThemeProvider>
        <WebVitalsReporter />
      </body>
    </html>
  );
}
