import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerLocale } from "@/lib/i18n/server";
import { headers } from "next/headers";
import { MotionProvider } from "@/components/motion-provider";
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
  const locale = await getServerLocale();
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || undefined;

  return (
    <html lang={locale} nonce={nonce}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        nonce={nonce}
      >
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
