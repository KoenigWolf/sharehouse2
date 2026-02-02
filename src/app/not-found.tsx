import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getServerTranslator();

  return (
    <div className="min-h-screen bg-[#f5f6f4] flex flex-col">
      <header className="border-b border-[#dddfd9] bg-white">
        <div className="container mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="text-lg tracking-wider text-[#272a26]">
            SHARE HOUSE
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-6xl text-[#bdc0ba] mb-6 font-light">404</p>
          <h1 className="text-xl text-[#272a26] mb-3 tracking-wide">
            {t("pages.notFound.title")}
          </h1>
          <p className="text-sm text-[#636861] mb-8 leading-relaxed">
            {t("pages.notFound.description")}
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-[#272a26] text-white text-sm tracking-wide hover:bg-[#363933] transition-colors"
          >
            {t("pages.notFound.backHome")}
          </Link>
        </div>
      </main>

      <footer className="border-t border-[#dddfd9] bg-white">
        <div className="container mx-auto px-6 py-4">
          <p className="text-xs text-[#959892] text-center">
            Share House Portal
          </p>
        </div>
      </footer>
    </div>
  );
}
