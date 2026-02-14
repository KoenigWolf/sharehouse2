import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getServerTranslator } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator();
  return {
    title: t("legal.privacyTitle"),
    description: t("legal.privacyMetaDescription"),
  };
}

export default async function PrivacyPage() {
  const t = await getServerTranslator();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            {t("common.back")}
          </Link>

          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {t("legal.privacyTitle")}
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              {t("legal.lastUpdated", { date: "2025-02-14" })}
            </p>

            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.privacy.section1Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed mb-3">
                  {t("legal.privacy.section1Content")}
                </p>
                <ul className="list-disc list-inside space-y-1 text-foreground/80">
                  <li>{t("legal.privacy.section1Item1")}</li>
                  <li>{t("legal.privacy.section1Item2")}</li>
                  <li>{t("legal.privacy.section1Item3")}</li>
                  <li>{t("legal.privacy.section1Item4")}</li>
                  <li>{t("legal.privacy.section1Item5")}</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.privacy.section2Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed mb-3">
                  {t("legal.privacy.section2Content")}
                </p>
                <ul className="list-disc list-inside space-y-1 text-foreground/80">
                  <li>{t("legal.privacy.section2Item1")}</li>
                  <li>{t("legal.privacy.section2Item2")}</li>
                  <li>{t("legal.privacy.section2Item3")}</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.privacy.section3Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed mb-3">
                  {t("legal.privacy.section3Content")}
                </p>
                <ul className="list-disc list-inside space-y-1 text-foreground/80">
                  <li>{t("legal.privacy.section3Item1")}</li>
                  <li>{t("legal.privacy.section3Item2")}</li>
                  <li>{t("legal.privacy.section3Item3")}</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.privacy.section4Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  {t("legal.privacy.section4Content")}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.privacy.section5Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  {t("legal.privacy.section5Content")}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.privacy.section6Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  {t("legal.privacy.section6Content")}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.privacy.section7Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  {t("legal.privacy.section7Content")}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.privacy.section8Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  {t("legal.privacy.section8Content")}
                </p>
              </div>
            </section>
          </article>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
